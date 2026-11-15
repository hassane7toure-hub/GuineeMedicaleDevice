import { Prisma } from "@prisma/client";
import { db } from "./db";
import { gnfNumber } from "./format";
import { fold, readSpecs } from "./text";

const productInclude = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  documents: true,
} satisfies Prisma.ProductInclude;

export type CatalogQuery = {
  q?: string;
  categorie?: string;
  marque?: string;
  dispo?: string;
  usage?: string;
  etablissement?: string;
  min?: string;
  max?: string;
  tri?: string;
  page?: string;
};

function priceFilter(min?: string, max?: string): Prisma.BigIntFilter | undefined {
  const filter: Prisma.BigIntFilter = {};
  if (min && /^\d+$/.test(min)) filter.gte = BigInt(min);
  if (max && /^\d+$/.test(max)) filter.lte = BigInt(max);
  return Object.keys(filter).length ? filter : undefined;
}

export async function queryProducts(params: CatalogQuery) {
  const pageSize = 8;
  const page = Math.max(1, Number(params.page) || 1);
  const where: Prisma.ProductWhereInput = { active: true };
  if (params.categorie) where.category = { slug: params.categorie, active: true };
  if (params.marque) where.brand = { slug: params.marque };
  if (params.dispo) where.availability = params.dispo;
  if (params.etablissement) where.audience = { contains: params.etablissement };
  if (params.usage) where.usage = { contains: params.usage };
  if (params.q) where.searchText = { contains: fold(params.q) };
  const price = priceFilter(params.min, params.max);
  if (price) where.priceGnf = price;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    params.tri === "prix-asc"
      ? [{ priceGnf: "asc" }]
      : params.tri === "prix-desc"
        ? [{ priceGnf: "desc" }]
        : params.tri === "nom"
          ? [{ name: "asc" }]
          : [{ featured: "desc" }, { name: "asc" }];

  const [total, rows, categories, brands] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    total,
    categories,
    brands,
    products: rows.map(toCard),
  };
}

export async function getProduct(slug: string) {
  const product = await db.product.findFirst({
    where: { slug, active: true },
    include: productInclude,
  });
  if (!product) return null;
  const related = await db.product.findMany({
    where: { active: true, categoryId: product.categoryId, id: { not: product.id } },
    include: productInclude,
    take: 3,
  });
  return { ...toDetail(product), related: related.map(toCard) };
}

export async function featuredProducts() {
  const rows = await db.product.findMany({
    where: { active: true, featured: true },
    include: productInclude,
    orderBy: { name: "asc" },
    take: 4,
  });
  return rows.map(toCard);
}

export function canPurchase(product: { allowCart: boolean; priceGnf: bigint | null; availability: string }) {
  return Boolean(
    product.allowCart &&
      product.priceGnf !== null &&
      product.availability !== "OUT_OF_STOCK" &&
      product.availability !== "QUOTE_ONLY",
  );
}

function toCard(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
  const image = product.images[0];
  return {
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    summary: product.summary,
    brandName: product.brand.name,
    brandDemo: product.brand.isDemo,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    priceGnf: gnfNumber(product.priceGnf),
    availability: product.availability,
    isDemo: product.isDemo,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? "",
    quoteOnly: product.availability === "QUOTE_ONLY" || product.priceGnf === null,
  };
}

function toDetail(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
  return {
    ...toCard(product),
    description: product.description,
    leadTimeNote: product.leadTimeNote,
    usageNotes: product.usageNotes,
    installationNotes: product.installationNotes,
    accessoriesNote: product.accessoriesNote,
    warrantyNote: product.warrantyNote,
    stockQty: product.stockQty,
    allowQuote: product.allowQuote,
    allowQuestion: product.allowQuestion,
    canBuy: canPurchase(product),
    specs: readSpecs(product.specs),
    images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
    documents: product.documents
      .filter((document) => document.authorized)
      .map((document) => ({ id: document.id, title: document.title })),
    audience: product.audience.split(",").filter(Boolean),
    usage: product.usage.split(",").filter(Boolean),
  };
}

export type ProductCard = ReturnType<typeof toCard>;
