import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

function csv(rows: string[][]) {
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return `\uFEFF${rows.map((row) => row.map(cell).join(";")).join("\r\n")}`;
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || !can(user.role, "export")) return new Response("Accès refusé", { status: 403 });
  const type = new URL(request.url).searchParams.get("type");
  let body = "";
  let name = "export.csv";
  if (type === "orders") {
    const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true, payments: true } });
    body = csv([
      ["Référence", "Date", "Client", "Organisation", "E-mail", "Téléphone", "Ville", "Adresse", "Remise", "Total GNF", "État", "Paiement"],
      ...orders.map((order) => [
        order.reference,
        formatDate(order.createdAt),
        order.customerName,
        order.organization,
        order.email,
        order.phone,
        order.city,
        order.addressLine,
        order.deliveryName,
        order.totalGnf.toString(),
        order.status,
        order.payments.map((payment) => `${payment.status}:${payment.method}`).join(" | "),
      ]),
    ]);
    name = "commandes.csv";
  } else if (type === "quotes") {
    const quotes = await db.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } });
    body = csv([
      ["Référence", "Date", "Nom", "Organisation", "Fonction", "E-mail", "Téléphone", "Ville", "Besoin", "Produits", "État"],
      ...quotes.map((quote) => [
        quote.reference,
        formatDate(quote.createdAt),
        quote.name,
        quote.organization,
        quote.roleTitle,
        quote.email,
        quote.phone,
        quote.city,
        quote.need,
        quote.items.map((item) => `${item.sku} x${item.quantity}`).join(" | "),
        quote.status,
      ]),
    ]);
    name = "devis.csv";
  } else if (type === "services") {
    const requests = await db.serviceRequest.findMany({ orderBy: { createdAt: "desc" } });
    body = csv([
      ["Référence", "Date", "Type", "Équipement", "Lieu", "Urgence", "Nom", "E-mail", "Téléphone", "Description", "État"],
      ...requests.map((item) => [
        item.reference,
        formatDate(item.createdAt),
        item.serviceType,
        item.equipment,
        item.location,
        item.urgency,
        item.name,
        item.email,
        item.phone,
        item.description,
        item.status,
      ]),
    ]);
    name = "services.csv";
  } else {
    return new Response("Type inconnu", { status: 400 });
  }
  await audit({ userId: user.id, action: "export", entity: type, meta: { type } });
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
