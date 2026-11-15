"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { audit } from "@/lib/audit";
import { currentUser, setSession } from "@/lib/auth";
import { getOrCreateCart, getCart, linePurchasable } from "@/lib/cart";
import { db } from "@/lib/db";
import { notifyTeam } from "@/lib/mail";
import { issueOrderProforma, issueQuoteProforma } from "@/lib/proforma";
import { canAccessOrder, grantOrderAccess, setNotice } from "@/lib/notice";
import { can } from "@/lib/permissions";
import { applyVerified } from "@/lib/payments/apply";
import { createCinetPayCheckout, ProviderUnavailable } from "@/lib/payments/cinetpay";
import { availableMethods } from "@/lib/payments/methods";
import { sandboxTokenValid, signSandbox } from "@/lib/payments/provider";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { nextReference } from "@/lib/references";
import { siteUrl } from "@/lib/site";
import { savePrivateFile } from "@/lib/uploads";
import { checkoutSchema, contactSchema, fieldErrors, formTiming, privacySchema, quoteSchema, registerSchema, serviceSchema } from "@/lib/validators";

export type ActionState = { ok: boolean; message?: string; fieldErrors?: Record<string, string> };

const initialMessage = {
  fast: "Le formulaire a été envoyé trop rapidement. Attendez un instant, puis réessayez.",
  expired: "Le formulaire a expiré. Rechargez la page.",
  invalid: "Le formulaire est incomplet. Rechargez la page.",
};

async function protect(form: string, formData: FormData): Promise<ActionState | null> {
  const timing = formTiming(formData);
  if (timing === "spam") {
    await setNotice(form, "GMD-RECUE");
    redirect(confirmationPath(form));
  }
  if (timing !== "ok") return { ok: false, message: initialMessage[timing] };
  const allowed = await rateLimit(`${form}:${await clientIp()}`, 8, 60 * 60 * 1000);
  if (!allowed) return { ok: false, message: "Trop d'envois depuis ce réseau. Réessayez plus tard." };
  return null;
}

function confirmationPath(kind: string) {
  if (kind === "quote") return "/devis/confirmation";
  if (kind === "service") return "/services/confirmation";
  if (kind === "privacy") return "/confidentialite/confirmation";
  return "/contact/confirmation";
}

export async function createQuote(_state: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await protect("quote", formData);
  if (blocked) return blocked;
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors: fieldErrors(parsed.error) };
  const selected = formData.getAll("products").map(String).filter(Boolean);
  const products = selected.length
    ? await db.product.findMany({ where: { slug: { in: selected }, active: true } })
    : [];
  const user = await currentUser();
  const reference = await nextReference("DEV");
  const { consent: _consent, ...quoteData } = parsed.data;
  const quote = await db.quoteRequest.create({
    data: {
      reference,
      ...(user ? { user: { connect: { id: user.id } } } : {}),
      ...quoteData,
      items: {
        create: products.map((product) => ({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: Math.min(99, Math.max(1, Number(formData.get(`qty_${product.slug}`)) || 1)),
        })),
      },
    },
  });
  const files = formData.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0).slice(0, 3);
  try {
    for (const file of files) {
      const saved = await savePrivateFile(file);
      if (!saved) continue;
      await db.attachment.create({ data: { quoteId: quote.id, ...saved } });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pièce jointe refusée.";
    return { ok: false, message };
  }
  await notifyTeam({
    subject: `Demande de devis ${reference}`,
    body: `${parsed.data.name}\n${parsed.data.organization}\n${parsed.data.city}\n${parsed.data.phone}\n${parsed.data.email}\n\n${parsed.data.need}`,
    relatedType: "quote",
    relatedId: quote.id,
  });
  await issueQuoteProforma(quote.id, { userId: user?.id });
  await setNotice("quote", reference);
  redirect("/devis/confirmation");
}

export async function createContact(_state: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await protect("contact", formData);
  if (blocked) return blocked;
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    subject: formData.get("subject"),
    message: formData.get("message"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors: fieldErrors(parsed.error) };
  const reference = await nextReference("CTC");
  const { consent: _consent, ...contactData } = parsed.data;
  const message = await db.contactMessage.create({ data: { reference, ...contactData } });
  await notifyTeam({
    subject: `Contact ${reference} · ${parsed.data.subject}`,
    body: `${parsed.data.name}\n${parsed.data.email}\n${parsed.data.phone}\n\n${parsed.data.message}`,
    relatedType: "contact",
    relatedId: message.id,
  });
  await setNotice("contact", reference);
  redirect("/contact/confirmation");
}

export async function createService(_state: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await protect("service", formData);
  if (blocked) return blocked;
  const parsed = serviceSchema.safeParse({
    serviceType: formData.get("serviceType"),
    equipment: formData.get("equipment") || "",
    location: formData.get("location"),
    urgency: formData.get("urgency"),
    description: formData.get("description"),
    name: formData.get("name"),
    organization: formData.get("organization") || "",
    phone: formData.get("phone"),
    email: formData.get("email"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors: fieldErrors(parsed.error) };
  const user = await currentUser();
  const reference = await nextReference("SRV");
  const { consent: _consent, ...serviceData } = parsed.data;
  const request = await db.serviceRequest.create({ data: { reference, userId: user?.id, ...serviceData } });
  await notifyTeam({
    subject: `Demande de service ${reference}`,
    body: `${parsed.data.serviceType}\n${parsed.data.equipment}\n${parsed.data.location}\n${parsed.data.urgency}\n${parsed.data.name}\n${parsed.data.phone}\n\n${parsed.data.description}`,
    relatedType: "service",
    relatedId: request.id,
  });
  await setNotice("service", reference);
  redirect("/services/confirmation");
}

export async function createPrivacy(_state: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await protect("privacy", formData);
  if (blocked) return blocked;
  const parsed = privacySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    type: formData.get("type"),
    message: formData.get("message"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors: fieldErrors(parsed.error) };
  const reference = await nextReference("CNF");
  const { consent: _consent, ...privacyData } = parsed.data;
  const request = await db.privacyRequest.create({ data: { reference, ...privacyData } });
  await notifyTeam({
    subject: `Demande de données personnelles ${reference}`,
    body: `${parsed.data.type}\n${parsed.data.name}\n${parsed.data.email}\n\n${parsed.data.message}`,
    relatedType: "privacy",
    relatedId: request.id,
  });
  await setNotice("privacy", reference);
  redirect("/confidentialite/confirmation");
}

export async function addToCart(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const quantity = Math.min(99, Math.max(1, Number(formData.get("quantity")) || 1));
  const product = await db.product.findFirst({ where: { slug, active: true } });
  if (!product) redirect("/boutique");
  const purchasable = product.allowCart && product.priceGnf !== null && product.availability !== "OUT_OF_STOCK" && product.availability !== "QUOTE_ONLY";
  if (!purchasable) redirect(`/produit/${slug}?erreur=indisponible`);
  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.productId === product.id);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (product.stockQty !== null && product.stockQty < nextQuantity) redirect(`/produit/${slug}?erreur=stock`);
  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    create: { cartId: cart.id, productId: product.id, quantity: nextQuantity },
    update: { quantity: nextQuantity },
  });
  redirect("/panier");
}

export async function updateCart(formData: FormData) {
  const itemId = String(formData.get("itemId") || "");
  const quantity = Number(formData.get("quantity"));
  const cart = await getCart();
  const item = cart?.items.find((entry) => entry.id === itemId);
  if (!cart || !item) redirect("/panier");
  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    const nextQuantity = Math.min(99, quantity);
    if (item.product.stockQty !== null && item.product.stockQty < nextQuantity) redirect("/panier?erreur=stock");
    await db.cartItem.update({ where: { id: item.id }, data: { quantity: nextQuantity } });
  }
  redirect("/panier");
}

export async function placeOrder(_state: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await protect("order", formData);
  if (blocked) return blocked;
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    organization: formData.get("organization") || "",
    email: formData.get("email"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    area: formData.get("area") || "",
    addressLine: formData.get("addressLine") || "",
    notes: formData.get("notes") || "",
    deliveryOptionId: formData.get("deliveryOptionId"),
    intendedMethod: formData.get("intendedMethod"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors: fieldErrors(parsed.error) };

  const idempotencyKey = String(formData.get("idempotencyKey") || "");
  if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) return { ok: false, message: "Rechargez la page avant de confirmer." };
  const existing = await db.order.findUnique({ where: { idempotencyKey } });
  if (existing) redirect(`/commande/${existing.reference}`);

  const option = await db.deliveryOption.findFirst({ where: { id: parsed.data.deliveryOptionId, active: true } });
  if (!option) return { ok: false, message: "Ce mode de remise n'est plus disponible." };
  if ((option.fulfillment === "DELIVERY" || option.fulfillment === "INSTALLATION") && !parsed.data.addressLine) {
    return { ok: false, message: "L'adresse est requise pour cette option.", fieldErrors: { addressLine: "Indiquez l'adresse de remise ou d'installation." } };
  }
  const methods = await availableMethods();
  if (!methods.some((method) => method.id === parsed.data.intendedMethod)) {
    return { ok: false, message: "Ce mode de règlement n'est pas disponible." };
  }

  const cart = await getCart();
  if (!cart || cart.items.length === 0) return { ok: false, message: "Votre panier est vide." };
  const lines = [];
  let subtotal = 0n;
  for (const item of cart.items) {
    if (!linePurchasable(item)) return { ok: false, message: `« ${item.product.name} » n'est plus commandable dans cette quantité.` };
    const unit = item.product.priceGnf!;
    subtotal += unit * BigInt(item.quantity);
    lines.push({ productId: item.product.id, name: item.product.name, sku: item.product.sku, quantity: item.quantity, unitPriceGnf: unit });
  }
  const shippingPending = option.feePending || option.feeGnf === null;
  const shipping = shippingPending ? 0n : option.feeGnf!;
  const total = subtotal + shipping;
  const user = await currentUser();
  let userId = user?.id;
  let accountCreated = false;
  if (!user && formData.get("createAccount") === "oui") {
    const account = registerSchema.safeParse({
      name: parsed.data.customerName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      organization: parsed.data.organization,
      city: parsed.data.city,
      password: formData.get("password"),
    });
    if (!account.success) return { ok: false, message: "Le mot de passe du compte doit contenir 12 caractères, une lettre et un chiffre.", fieldErrors: fieldErrors(account.error) };
    const already = await db.user.findUnique({ where: { email: account.data.email } });
    if (!already) {
      const created = await db.user.create({
        data: {
          email: account.data.email,
          name: account.data.name,
          phone: account.data.phone || "",
          organization: account.data.organization || "",
          city: account.data.city || "",
          passwordHash: await bcrypt.hash(account.data.password, 12),
          role: "CUSTOMER",
        },
      });
      userId = created.id;
      accountCreated = true;
      await setSession({ sub: created.id, role: created.role, email: created.email, name: created.name });
    }
  }

  const reference = await nextReference("CMD");
  let orderId = "";
  try {
    const order = await db.order.create({
      data: {
        reference,
        userId,
        idempotencyKey,
        customerName: parsed.data.customerName,
        organization: parsed.data.organization || "",
        email: parsed.data.email,
        phone: parsed.data.phone,
        city: parsed.data.city,
        addressLine: parsed.data.addressLine || "",
        area: parsed.data.area || "",
        notes: parsed.data.notes || "",
        fulfillment: option.fulfillment,
        deliveryOptionId: option.id,
        deliveryName: option.name,
        shippingPending,
        subtotalGnf: subtotal,
        shippingGnf: shipping,
        totalGnf: total,
        intendedMethod: parsed.data.intendedMethod,
        createAccount: formData.get("createAccount") === "oui",
        items: { create: lines },
      },
    });
    orderId = order.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await db.order.findUnique({ where: { idempotencyKey } });
      if (raced) redirect(`/commande/${raced.reference}`);
    }
    throw error;
  }
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  await grantOrderAccess(reference);
  await notifyTeam({
    subject: `Commande ${reference} en attente de paiement`,
    body: `${parsed.data.customerName}\n${parsed.data.city}\n${parsed.data.phone}\n${parsed.data.email}\nMode : ${parsed.data.intendedMethod}`,
    relatedType: "order",
    relatedId: reference,
  });
  if (orderId) await issueOrderProforma(orderId, { userId });
  if (accountCreated) await audit({ userId, action: "account.create", entity: "user", entityId: userId, meta: { source: "checkout" } });
  redirect(`/commande/${reference}`);
}

export async function startPayment(formData: FormData) {
  const reference = String(formData.get("reference") || "");
  const methodId = String(formData.get("method") || "");
  const order = await db.order.findUnique({ where: { reference }, include: { payments: true } });
  if (!order || !["PENDING_PAYMENT", "AWAITING_REVIEW"].includes(order.status)) redirect("/commande/suivi");
  const viewer = await currentUser();
  const allowed =
    (viewer && viewer.id === order.userId) ||
    (viewer && can(viewer.role, "orders.read")) ||
    (await canAccessOrder(reference));
  if (!allowed) redirect("/commande/suivi");
  const method = (await availableMethods()).find((item) => item.id === methodId);
  if (!method) redirect(`/commande/${reference}?erreur=moyen`);
  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      status: "PENDING",
      method: method.id,
      provider: method.provider,
      amountGnf: order.totalGnf,
      idempotencyKey: `${order.id}:${order.payments.length + 1}`,
    },
  });
  if (method.provider === "offline") {
    await notifyTeam({
      subject: `Règlement hors ligne à confirmer · ${reference}`,
      body: `Commande ${reference}. Aucun encaissement en ligne n'a été réalisé.`,
      relatedType: "order",
      relatedId: order.id,
    });
    redirect(`/commande/${reference}?info=hors-ligne`);
  }
  if (method.provider === "sandbox") {
    redirect(`/paiement/sandbox/${payment.id}?token=${signSandbox(payment.id)}`);
  }
  try {
    const checkout = await createCinetPayCheckout({
      paymentId: payment.id,
      orderReference: reference,
      amountGnf: Number(order.totalGnf),
      customerName: order.customerName,
      customerEmail: order.email,
      customerPhone: order.phone,
      description: `Commande ${reference}`,
      returnUrl: `${siteUrl()}/paiement/retour?reference=${reference}`,
      notifyUrl: `${siteUrl()}/api/paiements/notification/cinetpay`,
    });
    await db.payment.update({
      where: { id: payment.id },
      data: { checkoutUrl: checkout.redirectUrl, providerRef: checkout.providerRef },
    });
    redirect(checkout.redirectUrl);
  } catch (error) {
    const message = error instanceof ProviderUnavailable ? error.message : error instanceof Error ? error.message : "Paiement indisponible";
    await applyVerified({
      paymentId: payment.id,
      provider: "cinetpay",
      providerRef: payment.id,
      providerEventId: `cinetpay:${payment.id}:init-failed`,
      status: "FAILED",
      payload: JSON.stringify({ note: message }),
    });
    redirect(`/commande/${reference}?erreur=prestataire`);
  }
}

export async function simulatePayment(formData: FormData) {
  if (process.env.PAYMENT_MODE === "live") redirect("/");
  const paymentId = String(formData.get("paymentId") || "");
  const token = String(formData.get("token") || "");
  const outcome = String(formData.get("outcome") || "");
  if (!sandboxTokenValid(paymentId, token)) redirect("/");
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment || payment.provider !== "sandbox") redirect("/");
  const status = outcome === "paid" ? "PAID" : outcome === "failed" ? "FAILED" : outcome === "cancelled" ? "CANCELLED" : "REVIEW";
  const method = payment.method === "SANDBOX_VISA" ? "VISA_SIMULATION" : "ORANGE_MONEY_SIMULATION";
  await applyVerified({
    paymentId,
    provider: "sandbox",
    providerRef: paymentId,
    providerEventId: `sandbox:${paymentId}:${status}`,
    status,
    method,
    payload: JSON.stringify({ outcome, mode: "test" }),
  });
  redirect(`/commande/${payment.order.reference}`);
}

export async function lookupOrder(_state: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await protect("lookup", formData);
  if (blocked) return blocked;
  const reference = String(formData.get("reference") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const order = await db.order.findUnique({ where: { reference } });
  if (!order || order.email.toLowerCase() !== email) {
    return { ok: false, message: "Référence ou e-mail incorrect." };
  }
  await grantOrderAccess(order.reference);
  redirect(`/commande/${order.reference}`);
}
