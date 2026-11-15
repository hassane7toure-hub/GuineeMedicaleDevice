import { Prisma } from "@prisma/client";
import { audit } from "../audit";
import { db } from "../db";
import { notifyTeam } from "../mail";
import { redactText } from "../sanitize";
import type { VerifiedPayment } from "./provider";
import { canTransition, isPaymentStatus, type PaymentStatus } from "./transitions";

class StockShortfall extends Error {}

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function reserveStock(paymentId: string) {
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw new Error("Paiement introuvable.");
    if (payment.order.stockApplied) return;
    for (const item of payment.order.items) {
      if (!item.productId) continue;
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stockQty === null) continue;
      const updated = await tx.product.updateMany({
        where: { id: product.id, stockQty: { gte: item.quantity } },
        data: { stockQty: { decrement: item.quantity } },
      });
      if (updated.count !== 1) throw new StockShortfall();
      const fresh = await tx.product.findUnique({ where: { id: product.id } });
      if (fresh && fresh.stockQty === 0 && fresh.availability === "IN_STOCK") {
        await tx.product.update({ where: { id: product.id }, data: { availability: "OUT_OF_STOCK" } });
      }
    }
    await tx.order.update({ where: { id: payment.orderId }, data: { stockApplied: true } });
  });
}

export async function applyVerified(input: VerifiedPayment) {
  const existingEvent = await db.paymentEvent.findUnique({ where: { providerEventId: input.providerEventId } });
  if (existingEvent) return { duplicate: true, status: existingEvent.status };

  const payment = await db.payment.findUnique({ where: { id: input.paymentId }, include: { order: true } });
  if (!payment || !isPaymentStatus(payment.status)) throw new Error("Paiement introuvable.");
  if (payment.provider !== input.provider && input.provider !== "manual") {
    throw new Error("Prestataire inattendu.");
  }

  const next = input.status;
  if (payment.status === next) {
    await db.paymentEvent.create({
      data: {
        paymentId: payment.id,
        providerEventId: input.providerEventId,
        type: "DUPLICATE_STATUS",
        status: next,
        payload: input.payload ? redactText(input.payload) : "{}",
      },
    }).catch((error: unknown) => {
      if (!isUnique(error)) throw error;
    });
    return { duplicate: true, status: next };
  }

  if (!canTransition(payment.status, next)) {
    await db.paymentEvent.create({
      data: {
        paymentId: payment.id,
        providerEventId: input.providerEventId,
        type: "IGNORED_TRANSITION",
        status: payment.status,
        payload: input.payload ? redactText(input.payload) : "{}",
      },
    }).catch((error: unknown) => {
      if (!isUnique(error)) throw error;
    });
    return { duplicate: false, status: payment.status, ignored: true };
  }

  if (next === "PAID") {
    try {
      await reserveStock(payment.id);
    } catch (error) {
      if (error instanceof StockShortfall) {
        return applyVerified({
          ...input,
          status: "REVIEW",
          providerEventId: `${input.providerEventId}:stock`,
          payload: JSON.stringify({ note: "Stock insuffisant au moment de la confirmation." }),
        });
      }
      throw error;
    }
  }

  let orderStatus = payment.order.status;
  if (next === "PAID") orderStatus = "CONFIRMED";
  else if (next === "REFUNDED") orderStatus = "REFUNDED";
  else if (next === "REVIEW" && !["CONFIRMED", "FULFILLED", "REFUNDED"].includes(payment.order.status)) {
    orderStatus = "AWAITING_REVIEW";
  }

  try {
    await db.$transaction([
      db.paymentEvent.create({
        data: {
          paymentId: payment.id,
          providerEventId: input.providerEventId,
          type: "STATUS",
          status: next,
          payload: input.payload ? redactText(input.payload) : "{}",
        },
      }),
      db.payment.update({
        where: { id: payment.id },
        data: {
          status: next,
          method: input.method || payment.method,
          providerRef: input.providerRef || payment.providerRef,
          verifiedAt: next === "PAID" ? new Date() : payment.verifiedAt,
        },
      }),
      db.order.update({ where: { id: payment.orderId }, data: { status: orderStatus } }),
    ]);
  } catch (error) {
    if (isUnique(error)) return { duplicate: true, status: payment.status };
    throw error;
  }

  if (next === "PAID" || next === "REVIEW") {
    await notifyTeam({
      subject: `Paiement ${next === "PAID" ? "confirmé" : "à vérifier"} · ${payment.order.reference}`,
      body: `Commande ${payment.order.reference}\nStatut paiement : ${next}\nMoyen : ${input.method || payment.method}\nPrestataire : ${payment.provider}`,
      relatedType: "order",
      relatedId: payment.orderId,
    });
  }

  await audit({
    action: "payment.status",
    entity: "payment",
    entityId: payment.id,
    meta: { status: next, provider: payment.provider, order: payment.order.reference },
  });

  return { duplicate: false, status: next as PaymentStatus };
}
