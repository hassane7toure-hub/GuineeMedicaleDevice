import { Prisma } from "@prisma/client";
import { audit } from "./audit";
import { db } from "./db";
import { formatDate, formatGnf } from "./format";
import { notifyCustomer } from "./mail";
import { nextReference } from "./references";
import { getSettings } from "./settings";
import { signScoped } from "./session-token";
import { siteUrl } from "./site";

export type ProformaLine = {
  name: string;
  sku: string;
  quantity: number;
  unitPriceGnf: string | null;
  pending: boolean;
  demo: boolean;
};

type SavedProforma = {
  id: string;
  number: string;
  kind: string;
  email: string;
  customerName: string;
  organization: string;
  phone: string;
  city: string;
  addressLine: string;
  lines: string;
  subtotalGnf: bigint | null;
  shippingGnf: bigint | null;
  shippingPending: boolean;
  totalGnf: bigint | null;
  pricePending: boolean;
  includesDemo: boolean;
  deliveryName: string;
  sourceReference: string;
  createdAt: Date;
};

function money(value: bigint | null | undefined) {
  if (value === null || value === undefined) return null;
  return value.toString();
}

function lineAmount(line: ProformaLine) {
  if (line.pending || !line.unitPriceGnf || !/^\d+$/.test(line.unitPriceGnf)) return null;
  return BigInt(line.unitPriceGnf) * BigInt(line.quantity);
}

export function parseProformaLines(raw: string): ProformaLine[] {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const line = item as Partial<ProformaLine>;
      const quantity = Number(line.quantity);
      if (!line.name || !Number.isInteger(quantity) || quantity < 1) return [];
      const unit = typeof line.unitPriceGnf === "string" && /^\d+$/.test(line.unitPriceGnf) ? line.unitPriceGnf : null;
      return [{
        name: String(line.name).slice(0, 180),
        sku: String(line.sku || "").slice(0, 60),
        quantity,
        unitPriceGnf: unit,
        pending: Boolean(line.pending) || unit === null,
        demo: Boolean(line.demo),
      }];
    });
  } catch {
    return [];
  }
}

function totals(lines: ProformaLine[], shippingGnf: bigint | null, shippingPending: boolean) {
  let subtotal = 0n;
  let pricePending = false;
  for (const line of lines) {
    const amount = lineAmount(line);
    if (amount === null) pricePending = true;
    else subtotal += amount;
  }
  if (lines.length === 0) pricePending = true;
  const total = pricePending ? null : subtotal + (shippingPending ? 0n : shippingGnf ?? 0n);
  return { subtotal: pricePending && subtotal === 0n ? null : subtotal, total, pricePending };
}

export function proformaPlainText(proforma: SavedProforma, issuer: { name: string; address: string; city: string; country: string; phone: string; email: string }) {
  const lines = parseProformaLines(proforma.lines);
  const rows = lines.map((line) => {
    const amount = lineAmount(line);
    const unit = line.pending ? "à confirmer" : formatGnf(line.unitPriceGnf ? BigInt(line.unitPriceGnf) : null);
    const total = amount === null ? "à confirmer" : formatGnf(amount);
    return `- ${line.name}${line.demo ? " (démonstration)" : ""} · ${line.sku || "sans référence"} · qté ${line.quantity} · ${unit} · ${total}`;
  });
  const linked = proforma.kind === "ORDER" ? "Commande" : "Demande de devis";
  return [
    "FACTURE PROFORMA",
    proforma.number,
    `Établie le ${formatDate(proforma.createdAt)}`,
    "Ce document n'est pas une facture définitive et n'atteste pas un paiement.",
    "",
    "Émetteur",
    issuer.name,
    [issuer.address, issuer.city, issuer.country].filter(Boolean).join(", "),
    [issuer.phone, issuer.email].filter(Boolean).join(" · "),
    "",
    "Client",
    [proforma.customerName, proforma.organization].filter(Boolean).join(" · "),
    [proforma.addressLine, proforma.city].filter(Boolean).join(", "),
    [proforma.phone, proforma.email].filter(Boolean).join(" · "),
    "",
    `Liée à : ${linked} ${proforma.sourceReference}`,
    proforma.deliveryName ? `Remise : ${proforma.deliveryName}` : "",
    "",
    ...rows,
    "",
    `Sous-total : ${proforma.subtotalGnf === null ? "à confirmer" : formatGnf(proforma.subtotalGnf)}`,
    proforma.kind === "ORDER"
      ? `Frais de remise : ${proforma.shippingPending ? "à confirmer, non ajoutés" : formatGnf(proforma.shippingGnf)}`
      : "",
    `Total : ${proforma.pricePending || proforma.totalGnf === null ? "à confirmer" : formatGnf(proforma.totalGnf)}`,
    proforma.pricePending ? "Certaines lignes n'ont pas de prix au catalogue. L'équipe les confirmera." : "",
    proforma.includesDemo ? "Les lignes de démonstration ne constituent pas une offre contractuelle." : "",
  ].filter((line) => line !== "").join("\n");
}

async function issuer() {
  const settings = await getSettings();
  return {
    name: settings.legalName || settings.companyName,
    address: settings.address,
    city: settings.city,
    country: settings.country,
    phone: settings.phone,
    email: settings.email,
  };
}

async function accessUrl(number: string) {
  const token = await signScoped("proforma", { number }, "90d");
  return `${siteUrl()}/proforma/${encodeURIComponent(number)}?acces=${encodeURIComponent(token)}`;
}

async function deliver(proforma: SavedProforma, userId?: string | null) {
  const company = await issuer();
  const text = proformaPlainText(proforma, company);
  const url = await accessUrl(proforma.number);
  const result = await notifyCustomer({
    to: proforma.email,
    subject: `Facture proforma ${proforma.number}`,
    body: text,
    emailBody: `${text}\n\nOuvrir, imprimer ou enregistrer en PDF :\n${url}`,
    relatedType: "proforma",
    relatedId: proforma.id,
  });
  const saved = await db.proforma.update({
    where: { id: proforma.id },
    data: { sentStatus: result.status, sentError: result.error },
  });
  await audit({
    userId,
    action: "proforma.send",
    entity: "proforma",
    entityId: proforma.id,
    meta: { status: result.status, kind: proforma.kind, number: proforma.number },
  });
  return saved;
}

async function createProforma(data: Prisma.ProformaCreateInput) {
  try {
    return await db.proforma.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = data.order?.connect?.id
        ? await db.proforma.findUnique({ where: { orderId: data.order.connect.id } })
        : data.quote?.connect?.id
          ? await db.proforma.findUnique({ where: { quoteId: data.quote.connect.id } })
          : null;
      if (existing) return existing;
    }
    throw error;
  }
}

export async function issueOrderProforma(orderId: string, options?: { resend?: boolean; userId?: string | null }) {
  const existing = await db.proforma.findUnique({ where: { orderId } });
  if (existing && !options?.resend) return existing;
  if (existing && options?.resend) return deliver(existing, options.userId);
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { isDemo: true } } } } },
  });
  if (!order) return null;
  const lines: ProformaLine[] = order.items.map((item) => ({
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unitPriceGnf: money(item.unitPriceGnf),
    pending: false,
    demo: Boolean(item.product?.isDemo),
  }));
  const summed = totals(lines, order.shippingPending ? null : order.shippingGnf, order.shippingPending);
  const number = await nextReference("PRO");
  const created = await createProforma({
    number,
    kind: "ORDER",
    order: { connect: { id: order.id } },
    customerName: order.customerName,
    organization: order.organization,
    email: order.email,
    phone: order.phone,
    city: order.city,
    addressLine: order.addressLine,
    lines: JSON.stringify(lines),
    subtotalGnf: summed.subtotal,
    shippingGnf: order.shippingPending ? null : order.shippingGnf,
    shippingPending: order.shippingPending,
    totalGnf: summed.total,
    pricePending: summed.pricePending,
    includesDemo: lines.some((line) => line.demo),
    deliveryName: order.deliveryName,
    sourceReference: order.reference,
    sentStatus: "QUEUED",
  });
  if (created.number !== number && !options?.resend) return created;
  return deliver(created, options?.userId);
}

export async function issueQuoteProforma(quoteId: string, options?: { resend?: boolean; userId?: string | null }) {
  const existing = await db.proforma.findUnique({ where: { quoteId } });
  if (existing && !options?.resend) return existing;
  if (existing && options?.resend) return deliver(existing, options.userId);
  const quote = await db.quoteRequest.findUnique({ where: { id: quoteId }, include: { items: true } });
  if (!quote) return null;
  const products = await db.product.findMany({
    where: { id: { in: quote.items.map((item) => item.productId).filter((id): id is string => Boolean(id)) } },
    select: { id: true, priceGnf: true, isDemo: true },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: ProformaLine[] = quote.items.map((item) => {
    const product = item.productId ? byId.get(item.productId) : undefined;
    const unit = product?.priceGnf ?? null;
    return {
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceGnf: money(unit),
      pending: unit === null,
      demo: Boolean(product?.isDemo),
    };
  });
  if (lines.length === 0) {
    lines.push({
      name: quote.need.slice(0, 180) || "Besoin décrit dans la demande",
      sku: "",
      quantity: 1,
      unitPriceGnf: null,
      pending: true,
      demo: false,
    });
  }
  const summed = totals(lines, null, false);
  const number = await nextReference("PRO");
  const created = await createProforma({
    number,
    kind: "QUOTE",
    quote: { connect: { id: quote.id } },
    customerName: quote.name,
    organization: quote.organization,
    email: quote.email,
    phone: quote.phone,
    city: quote.city,
    addressLine: "",
    lines: JSON.stringify(lines),
    subtotalGnf: summed.subtotal,
    shippingGnf: null,
    shippingPending: false,
    totalGnf: summed.total,
    pricePending: summed.pricePending,
    includesDemo: lines.some((line) => line.demo),
    deliveryName: "",
    sourceReference: quote.reference,
    sentStatus: "QUEUED",
  });
  if (created.number !== number && !options?.resend) return created;
  return deliver(created, options?.userId);
}

export function proformaSendNote(status: string) {
  if (status === "SENT") return "La facture proforma a été envoyée à l'adresse indiquée.";
  if (status === "FAILED") return "La facture proforma est prête, mais l'e-mail n'a pas abouti. Vous pouvez l'ouvrir et l'enregistrer en PDF.";
  return "La facture proforma est prête. L'e-mail part lorsque la messagerie est configurée. Vous pouvez l'ouvrir, l'imprimer ou l'enregistrer en PDF.";
}
