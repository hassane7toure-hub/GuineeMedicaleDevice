"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { applyVerified } from "@/lib/payments/apply";
import type { PaymentStatus } from "@/lib/payments/transitions";
import { isPaymentStatus } from "@/lib/payments/transitions";
import { getSettings, saveSettings } from "@/lib/settings";
import { mergeSettings } from "@/lib/settings-data";
import { fold, parseSpecs, slugify } from "@/lib/text";
import { issueOrderProforma, issueQuoteProforma } from "@/lib/proforma";
import { savePrivateFile, savePublicImage } from "@/lib/uploads";

function text(formData: FormData, key: string, max = 2000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "oui";
}

function uploadErrorCode(error: unknown, kind: "photo" | "document") {
  const message = error instanceof Error ? error.message : "";
  if (/lourde|lourd/i.test(message)) return `${kind}-taille`;
  return `${kind}-format`;
}

export async function saveProduct(formData: FormData) {
  const user = await guard("catalog.write");
  const id = text(formData, "id", 40);
  const name = text(formData, "name", 180);
  const sku = text(formData, "sku", 60);
  const slugInput = text(formData, "slug", 80) || slugify(name);
  if (!name || !sku || !slugInput) redirect("/admin/produits/nouveau?erreur=champs");
  const brandId = text(formData, "brandId", 40);
  const categoryId = text(formData, "categoryId", 40);
  const priceRaw = text(formData, "priceGnf", 18);
  const stockRaw = text(formData, "stockQty", 8);
  let availability = text(formData, "availability", 20);
  const allowed = ["IN_STOCK", "ON_ORDER", "OUT_OF_STOCK", "QUOTE_ONLY"];
  if (!allowed.includes(availability)) availability = "ON_ORDER";
  let priceGnf = /^\d+$/.test(priceRaw) ? BigInt(priceRaw) : null;
  const stockQty = /^\d+$/.test(stockRaw) ? Number(stockRaw) : null;
  if (availability === "QUOTE_ONLY") priceGnf = null;
  if (availability === "IN_STOCK" && stockQty === 0) availability = "OUT_OF_STOCK";
  const audience = formData.getAll("audience").map(String).join(",");
  const usage = formData.getAll("usage").map(String).join(",");
  const brand = await db.brand.findUnique({ where: { id: brandId } });
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!brand || !category) redirect("/admin/produits?erreur=lien");
  const specs = JSON.stringify(parseSpecs(text(formData, "specs", 8000)));
  const data = {
    name,
    sku,
    slug: slugify(slugInput),
    summary: text(formData, "summary", 400),
    description: text(formData, "description", 8000),
    searchText: fold([name, sku, text(formData, "summary", 400), text(formData, "description", 8000), brand.name, category.name].join(" ")),
    brandId,
    categoryId,
    priceGnf,
    availability,
    stockQty,
    leadTimeNote: text(formData, "leadTimeNote", 400),
    usageNotes: text(formData, "usageNotes", 2000),
    installationNotes: text(formData, "installationNotes", 2000),
    accessoriesNote: text(formData, "accessoriesNote", 2000),
    warrantyNote: text(formData, "warrantyNote", 1000),
    audience,
    usage,
    featured: checked(formData, "featured"),
    active: checked(formData, "active"),
    isDemo: checked(formData, "isDemo"),
    allowCart: checked(formData, "allowCart"),
    allowQuote: checked(formData, "allowQuote"),
    allowQuestion: checked(formData, "allowQuestion"),
    specs,
  };
  const product = id
    ? await db.product.update({ where: { id }, data })
    : await db.product.create({ data });
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      const saved = await savePublicImage(image, text(formData, "imageAlt", 180) || name);
      if (saved) await db.productImage.create({ data: { productId: product.id, url: saved.url, alt: saved.alt } });
    } catch (error) {
      redirect(`/admin/produits/${product.id}?erreur=${uploadErrorCode(error, "photo")}`);
    }
  }
  const document = formData.get("document");
  if (document instanceof File && document.size > 0) {
    try {
      const saved = await savePrivateFile(document);
      if (saved) {
        await db.productDocument.create({
          data: {
            productId: product.id,
            title: text(formData, "documentTitle", 160) || saved.originalName,
            storedName: saved.storedName,
            mime: saved.mime,
            authorized: checked(formData, "documentAuthorized"),
          },
        });
      }
    } catch (error) {
      redirect(`/admin/produits/${product.id}?erreur=${uploadErrorCode(error, "document")}`);
    }
  }
  await audit({ userId: user.id, action: id ? "product.update" : "product.create", entity: "product", entityId: product.id });
  redirect(`/admin/produits/${product.id}?ok=1`);
}

export async function detachImage(formData: FormData) {
  await guard("catalog.write");
  const id = text(formData, "imageId", 40);
  const image = await db.productImage.findUnique({ where: { id } });
  if (image) await db.productImage.delete({ where: { id } });
  redirect(`/admin/produits/${image?.productId || ""}?ok=1`);
}

export async function archiveProduct(formData: FormData) {
  const user = await guard("catalog.write");
  const id = text(formData, "id", 40);
  await db.product.update({ where: { id }, data: { active: false } });
  await audit({ userId: user.id, action: "product.archive", entity: "product", entityId: id });
  redirect("/admin/produits?ok=1");
}

export async function saveCategory(formData: FormData) {
  const user = await guard("catalog.write");
  const id = text(formData, "id", 40);
  const name = text(formData, "name", 120);
  if (!name) redirect("/admin/categories?erreur=nom");
  const data = {
    name,
    slug: slugify(text(formData, "slug", 80) || name),
    description: text(formData, "description", 500),
    sortOrder: Number(text(formData, "sortOrder", 4)) || 0,
    active: checked(formData, "active"),
  };
  const category = id ? await db.category.update({ where: { id }, data }) : await db.category.create({ data });
  await audit({ userId: user.id, action: "category.save", entity: "category", entityId: category.id });
  redirect("/admin/categories?ok=1");
}

export async function saveBrand(formData: FormData) {
  const user = await guard("catalog.write");
  const id = text(formData, "id", 40);
  const name = text(formData, "name", 120);
  if (!name) redirect("/admin/marques?erreur=nom");
  const data = {
    name,
    slug: slugify(text(formData, "slug", 80) || name),
    note: text(formData, "note", 300),
    isDemo: checked(formData, "isDemo"),
  };
  const brand = id ? await db.brand.update({ where: { id }, data }) : await db.brand.create({ data });
  await audit({ userId: user.id, action: "brand.save", entity: "brand", entityId: brand.id });
  redirect("/admin/marques?ok=1");
}

export async function saveDelivery(formData: FormData) {
  const user = await guard("delivery.write");
  const id = text(formData, "id", 40);
  const name = text(formData, "name", 120);
  const fulfillment = text(formData, "fulfillment", 20);
  if (!name || !["DELIVERY", "PICKUP", "INSTALLATION"].includes(fulfillment)) redirect("/admin/livraison?erreur=champs");
  const feePending = checked(formData, "feePending");
  const feeRaw = text(formData, "feeGnf", 18);
  const data = {
    name,
    description: text(formData, "description", 500),
    fulfillment,
    feePending,
    feeGnf: feePending || !/^\d+$/.test(feeRaw) ? null : BigInt(feeRaw),
    delayNote: text(formData, "delayNote", 300),
    active: checked(formData, "active"),
    isDemo: checked(formData, "isDemo"),
    sortOrder: Number(text(formData, "sortOrder", 4)) || 0,
  };
  const option = id ? await db.deliveryOption.update({ where: { id }, data }) : await db.deliveryOption.create({ data });
  await audit({ userId: user.id, action: "delivery.save", entity: "delivery", entityId: option.id });
  redirect("/admin/livraison?ok=1");
}

export async function savePage(formData: FormData) {
  const user = await guard("content.write");
  const slug = text(formData, "slug", 80);
  const title = text(formData, "title", 160);
  if (!slug || !title) redirect("/admin/contenu?erreur=champs");
  await db.pageContent.upsert({
    where: { slug_locale: { slug, locale: "fr" } },
    create: {
      slug,
      locale: "fr",
      title,
      description: text(formData, "description", 180),
      body: text(formData, "body", 20000),
      needsReview: checked(formData, "needsReview"),
    },
    update: {
      title,
      description: text(formData, "description", 180),
      body: text(formData, "body", 20000),
      needsReview: checked(formData, "needsReview"),
    },
  });
  await audit({ userId: user.id, action: "content.save", entity: "page", entityId: slug });
  redirect(`/admin/contenu/${slug}?ok=1`);
}

export async function saveSiteSettings(formData: FormData) {
  const user = await guard("settings.write");
  const current = await getSettings();
  const blurbs = [0, 1, 2, 3].map((index) => text(formData, `service${index}`, 500)) as [
    string,
    string,
    string,
    string,
  ];
  const rateEur = text(formData, "rateEurPerGnf", 20);
  const rateUsd = text(formData, "rateUsdPerGnf", 20);
  const validRate = (value: string) => value === "" || (Number.isFinite(Number(value)) && Number(value) > 0);
  const payments = can(user.role, "payments.configure")
    ? {
        offline: checked(formData, "payOffline"),
        orangeMoney: checked(formData, "payOrange"),
        visa: checked(formData, "payVisa"),
        mastercard: checked(formData, "payMastercard"),
        paycard: checked(formData, "payPaycard"),
      }
    : current.payments;
  const next = mergeSettings({
    ...current,
    demoMode: checked(formData, "demoMode"),
    companyName: text(formData, "companyName", 120) || current.companyName,
    legalName: text(formData, "legalName", 160),
    legalNameNote: text(formData, "legalNameNote", 400),
    tagline: text(formData, "tagline", 180),
    heroTitle: text(formData, "heroTitle", 180),
    heroSubtitle: text(formData, "heroSubtitle", 400),
    intro: text(formData, "intro", 800),
    phone: text(formData, "phone", 30),
    whatsapp: text(formData, "whatsapp", 30),
    email: text(formData, "email", 160),
    address: text(formData, "address", 240),
    city: text(formData, "city", 80),
    hours: text(formData, "hours", 180),
    interventionAreas: text(formData, "interventionAreas", 500),
    facebook: text(formData, "facebook", 200),
    linkedin: text(formData, "linkedin", 200),
    rateEurPerGnf: validRate(rateEur) ? rateEur : "",
    rateUsdPerGnf: validRate(rateUsd) ? rateUsd : "",
    serviceBlurbs: blurbs,
    payments,
  });
  await saveSettings(next);
  await audit({ userId: user.id, action: "settings.save", entity: "settings", entityId: "default" });
  redirect("/admin/reglages?ok=1");
}

export async function setRequestStatus(formData: FormData) {
  const kind = text(formData, "kind", 20);
  const id = text(formData, "id", 40);
  const status = text(formData, "status", 20);
  const note = text(formData, "internalNote", 2000);
  const user =
    kind === "quote"
      ? await guard("quotes.write")
      : kind === "service"
        ? await guard("services.write")
        : await guard("messages.read");
  if (kind === "quote") await db.quoteRequest.update({ where: { id }, data: { status, internalNote: note } });
  if (kind === "service") await db.serviceRequest.update({ where: { id }, data: { status, internalNote: note } });
  if (kind === "contact") await db.contactMessage.update({ where: { id }, data: { status } });
  if (kind === "privacy") await db.privacyRequest.update({ where: { id }, data: { status } });
  await audit({ userId: user.id, action: "request.status", entity: kind, entityId: id, meta: { status } });
  if (kind === "contact" || kind === "privacy") redirect("/admin/messages?ok=1");
  redirect(`/admin/${kind === "quote" ? "devis" : "services"}/${id}?ok=1`);
}

export async function updateOrder(formData: FormData) {
  const user = await guard("orders.write");
  const id = text(formData, "id", 40);
  const status = text(formData, "status", 30);
  const allowed = ["PENDING_PAYMENT", "CONFIRMED", "AWAITING_REVIEW", "FULFILLED", "CANCELLED", "REFUNDED"];
  if (!allowed.includes(status)) redirect("/admin/commandes?erreur=statut");
  const order = await db.order.findUnique({ where: { id }, include: { payments: true } });
  if (!order) redirect("/admin/commandes");
  if (status === "FULFILLED" && order.status !== "CONFIRMED" && order.status !== "FULFILLED") {
    redirect(`/admin/commandes/${id}?erreur=paiement`);
  }
  if (status === "CANCELLED" && order.payments.some((payment) => payment.status === "PAID")) {
    redirect(`/admin/commandes/${id}?erreur=payee`);
  }
  await db.order.update({ where: { id }, data: { status, notes: text(formData, "notes", 2000) || order.notes } });
  await audit({ userId: user.id, action: "order.status", entity: "order", entityId: id, meta: { status } });
  redirect(`/admin/commandes/${id}?ok=1`);
}

export async function updatePayment(formData: FormData) {
  const user = await guard("payments.write");
  const id = text(formData, "id", 40);
  const status = text(formData, "status", 20);
  if (!isPaymentStatus(status)) redirect("/admin/commandes?erreur=paiement");
  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) redirect("/admin/commandes");
  await applyVerified({
    paymentId: id,
    provider: "manual",
    providerRef: payment.providerRef || id,
    providerEventId: `manual:${id}:${status}:${Date.now()}`,
    status: status as PaymentStatus,
    payload: JSON.stringify({ by: user.id, note: text(formData, "note", 300) }),
  });
  await audit({ userId: user.id, action: "payment.manual", entity: "payment", entityId: id, meta: { status } });
  redirect(`/admin/commandes/${payment.orderId}?ok=1`);
}

export async function saveUser(formData: FormData) {
  const actor = await guard("users.write");
  const id = text(formData, "id", 40);
  const email = text(formData, "email", 160).toLowerCase();
  const name = text(formData, "name", 120);
  const role = text(formData, "role", 20);
  const roles = ["ADMIN", "MANAGER", "SALES", "CATALOG", "SUPPORT", "CUSTOMER"];
  if (!email.includes("@") || name.length < 2 || !roles.includes(role)) redirect("/admin/utilisateurs?erreur=champs");
  const active = checked(formData, "active");
  if (id) {
    const current = await db.user.findUnique({ where: { id } });
    if (current?.role === "ADMIN" && (role !== "ADMIN" || !active)) {
      const admins = await db.user.count({ where: { role: "ADMIN", active: true, id: { not: id } } });
      if (admins === 0) redirect("/admin/utilisateurs?erreur=dernier-admin");
    }
  }
  const password = text(formData, "password", 200);
  if (!id && password.length < 12) redirect("/admin/utilisateurs?erreur=mot-de-passe");
  if (password && (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) {
    redirect("/admin/utilisateurs?erreur=mot-de-passe");
  }
  const data = {
    email,
    name,
    role,
    active,
    phone: text(formData, "phone", 30),
    organization: text(formData, "organization", 160),
    ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
  };
  const saved = id
    ? await db.user.update({ where: { id }, data })
    : await db.user.create({ data: { ...data, passwordHash: data.passwordHash || "" } });
  await audit({ userId: actor.id, action: "user.save", entity: "user", entityId: saved.id, meta: { role } });
  redirect("/admin/utilisateurs?ok=1");
}

export async function deliverProforma(formData: FormData) {
  const kind = text(formData, "kind", 12);
  const id = text(formData, "id", 40);
  const resend = formData.get("resend") === "oui";
  if (kind === "order") {
    const user = await guard("orders.read");
    await issueOrderProforma(id, { resend, userId: user.id });
    redirect(`/admin/commandes/${id}?ok=1`);
  }
  if (kind === "quote") {
    const user = await guard("quotes.write");
    await issueQuoteProforma(id, { resend, userId: user.id });
    redirect(`/admin/devis/${id}?ok=1`);
  }
  redirect("/admin");
}

export async function deactivateDemoCatalog() {
  const user = await guard("catalog.write");
  const result = await db.product.updateMany({ where: { isDemo: true, active: true }, data: { active: false } });
  await audit({ userId: user.id, action: "catalog.demo-off", entity: "product", meta: { count: result.count } });
  redirect("/admin?ok=demo");
}
