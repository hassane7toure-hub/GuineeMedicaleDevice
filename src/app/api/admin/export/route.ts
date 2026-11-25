import { audit } from "@/lib/audit";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { productRows, productTemplate } from "@/lib/product-sheet";
import { toCsv, toXlsx } from "@/lib/tabular";
import { userRows, userTemplate } from "@/lib/user-sheet";

export const runtime = "nodejs";

function csv(rows: string[][]) {
  return toCsv(rows);
}

async function download(rows: string[][], base: string, format: string) {
  if (format === "xlsx") {
    const body = await toXlsx(rows, base);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return new Response("Accès refusé", { status: 403 });
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const template = url.searchParams.get("modele") === "1";
  if (type === "products") {
    if (!can(user.role, "catalog.write")) return new Response("Accès refusé", { status: 403 });
    const rows = template
      ? productTemplate()
      : productRows(await db.product.findMany({ include: { brand: true, category: true }, orderBy: { name: "asc" } }));
    await audit({ userId: user.id, action: "export", entity: "products", meta: { type, format, template } });
    return download(rows, template ? "modele-produits" : "produits", format);
  }
  if (type === "users") {
    if (!can(user.role, "users.write")) return new Response("Accès refusé", { status: 403 });
    const rows = template
      ? userTemplate()
      : userRows(
          await db.user.findMany({
            orderBy: { name: "asc" },
            select: { name: true, email: true, phone: true, role: true, active: true, organization: true, roleTitle: true, city: true },
          }),
        );
    await audit({ userId: user.id, action: "export", entity: "users", meta: { type, format, template } });
    return download(rows, template ? "modele-utilisateurs" : "utilisateurs", format);
  }
  if (!can(user.role, "export")) return new Response("Accès refusé", { status: 403 });
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
