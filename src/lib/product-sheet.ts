import type { Prisma, PrismaClient } from "@prisma/client";
import { fr } from "@/i18n/fr";
import { fold, parseSpecs, slugify } from "@/lib/text";
import { headerKey, recordsFromTable, type SheetRecord } from "@/lib/tabular";

type Store = Prisma.TransactionClient | PrismaClient;

export const PRODUCT_HEADERS = [
  "Nom",
  "Référence",
  "Marque",
  "Catégorie",
  "Prix GNF",
  "Disponibilité",
  "Stock",
  "Résumé",
  "Description",
  "Caractéristiques",
  "Délai",
  "Usages",
  "Installation",
  "Accessoires",
  "Garantie",
  "Établissements",
  "Usages catalogue",
  "En avant",
  "Visible",
  "Démonstration",
  "Panier",
  "Devis",
  "Question",
] as const;

const PRODUCT_ALIASES: Record<string, string> = {
  nom: "name",
  name: "name",
  reference: "sku",
  referencesku: "sku",
  sku: "sku",
  ref: "sku",
  marque: "brand",
  brand: "brand",
  categorie: "category",
  category: "category",
  prix: "price",
  prixgnf: "price",
  disponibilite: "availability",
  availability: "availability",
  stock: "stock",
  stocksuivi: "stock",
  resume: "summary",
  summary: "summary",
  description: "description",
  caracteristiques: "specs",
  specs: "specs",
  delai: "lead",
  delaiindicatif: "lead",
  usages: "usageNotes",
  installation: "installation",
  accessoires: "accessories",
  garantie: "warranty",
  etablissements: "audience",
  audience: "audience",
  usagescatalogue: "usage",
  usage: "usage",
  enavant: "featured",
  featured: "featured",
  mettreenavant: "featured",
  visible: "active",
  actif: "active",
  demonstration: "demo",
  demo: "demo",
  panier: "cart",
  devis: "quote",
  question: "question",
  questiontechnique: "question",
};

const AVAILABILITY = new Map<string, string>([
  ["instock", "IN_STOCK"],
  ["disponible", "IN_STOCK"],
  ["enstock", "IN_STOCK"],
  ["onorder", "ON_ORDER"],
  ["surcommande", "ON_ORDER"],
  ["outofstock", "OUT_OF_STOCK"],
  ["rupture", "OUT_OF_STOCK"],
  ["quoteonly", "QUOTE_ONLY"],
  ["devis", "QUOTE_ONLY"],
  ["devisrequis", "QUOTE_ONLY"],
]);

function yesNo(value: boolean) {
  return value ? "oui" : "non";
}

function flag(value: string | undefined, fallback: boolean) {
  const key = headerKey(value || "");
  if (!key) return fallback;
  if (["oui", "yes", "true", "vrai", "1"].includes(key)) return true;
  if (["non", "no", "false", "faux", "0"].includes(key)) return false;
  return fallback;
}

function labels(value: string, dictionary: Record<string, string>) {
  const byLabel = new Map(Object.entries(dictionary).map(([key, label]) => [headerKey(label), key]));
  return value
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => byLabel.get(headerKey(part)) || (part in dictionary ? part : ""))
    .filter(Boolean)
    .join(",");
}

function labelList(value: string, dictionary: Record<string, string>) {
  return value
    .split(",")
    .filter(Boolean)
    .map((key) => dictionary[key] || key)
    .join(", ");
}

function wholeNumber(value: string) {
  const cleaned = value.replace(/[\s\u00a0]/g, "").replace(/\.0+$/, "");
  if (!cleaned) return null;
  if (!/^\d+$/.test(cleaned)) return "invalid" as const;
  return cleaned;
}

export function productTemplate() {
  return [[...PRODUCT_HEADERS]];
}

export function productRows(
  products: {
    name: string;
    sku: string;
    summary: string;
    description: string;
    priceGnf: bigint | null;
    availability: string;
    stockQty: number | null;
    leadTimeNote: string;
    usageNotes: string;
    installationNotes: string;
    accessoriesNote: string;
    warrantyNote: string;
    audience: string;
    usage: string;
    featured: boolean;
    active: boolean;
    isDemo: boolean;
    allowCart: boolean;
    allowQuote: boolean;
    allowQuestion: boolean;
    specs: string;
    brand: { name: string };
    category: { name: string };
  }[],
) {
  return [
    [...PRODUCT_HEADERS],
    ...products.map((product) => [
      product.name,
      product.sku,
      product.brand.name,
      product.category.name,
      product.priceGnf === null ? "" : product.priceGnf.toString(),
      fr.availability[product.availability as keyof typeof fr.availability] || product.availability,
      product.stockQty === null ? "" : String(product.stockQty),
      product.summary,
      product.description,
      specsText(product.specs),
      product.leadTimeNote,
      product.usageNotes,
      product.installationNotes,
      product.accessoriesNote,
      product.warrantyNote,
      labelList(product.audience, fr.audience),
      labelList(product.usage, fr.usage),
      yesNo(product.featured),
      yesNo(product.active),
      yesNo(product.isDemo),
      yesNo(product.allowCart),
      yesNo(product.allowQuote),
      yesNo(product.allowQuestion),
    ]),
  ];
}

function specsText(raw: string) {
  try {
    const specs = JSON.parse(raw) as { label: string; value: string }[];
    if (!Array.isArray(specs)) return "";
    return specs.map((spec) => `${spec.label}: ${spec.value}`).join(" | ");
  } catch {
    return "";
  }
}

export async function importProductTable(store: Store, table: string[][]) {
  const parsed = recordsFromTable(table, PRODUCT_ALIASES, ["name", "sku", "brand", "category"], 500);
  if (parsed.error) return { error: parsed.error, created: 0, skipped: 0, errors: [] as string[] };
  const brands = await store.brand.findMany();
  const categories = await store.category.findMany();
  const existing = await store.product.findMany({ select: { sku: true, slug: true } });
  const skus = new Set(existing.map((product) => product.sku.toLowerCase()));
  const slugs = new Set(existing.map((product) => product.slug));
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const row of parsed.records) {
    const message = await createProduct(store, row, brands, categories, skus, slugs);
    if (message) {
      skipped += 1;
      errors.push(message);
    } else created += 1;
  }
  return { error: undefined, created, skipped, errors };
}

async function createProduct(
  store: Store,
  row: SheetRecord,
  brands: { id: string; name: string; slug: string }[],
  categories: { id: string; name: string; slug: string; sortOrder: number }[],
  skus: Set<string>,
  slugs: Set<string>,
) {
  const values = row.values;
  const name = values.name.slice(0, 180);
  const sku = values.sku.slice(0, 60);
  const brandName = values.brand.slice(0, 120);
  const categoryName = values.category.slice(0, 120);
  if (!name || !sku || !brandName || !categoryName) return `Ligne ${row.line} : nom, référence, marque et catégorie sont requis.`;
  if (skus.has(sku.toLowerCase())) return `Ligne ${row.line} : la référence ${sku} existe déjà.`;
  const priceRaw = wholeNumber(values.price || "");
  if (priceRaw === "invalid") return `Ligne ${row.line} : le prix doit être un nombre entier de francs guinéens.`;
  const stockRaw = wholeNumber(values.stock || "");
  if (stockRaw === "invalid") return `Ligne ${row.line} : le stock doit être un nombre entier, ou vide.`;
  let availability = AVAILABILITY.get(headerKey(values.availability || "")) || "ON_ORDER";
  let priceGnf = priceRaw === null ? null : BigInt(priceRaw);
  const stockQty = stockRaw === null ? null : Number(stockRaw);
  if (availability === "QUOTE_ONLY") priceGnf = null;
  if (availability === "IN_STOCK" && stockQty === 0) availability = "OUT_OF_STOCK";
  const brand = await ensureNamed(brands, brandName, (slug) =>
    store.brand.create({ data: { name: brandName, slug, note: "", isDemo: false } }),
  );
  const category = await ensureNamed(categories, categoryName, (slug) =>
    store.category.create({
      data: { name: categoryName, slug, description: "", sortOrder: categories.length + 1, active: true },
    }),
  );
  let slug = slugify(name) || slugify(sku);
  if (!slug) return `Ligne ${row.line} : le nom ne permet pas de créer une adresse.`;
  if (slugs.has(slug)) slug = slugify(`${name}-${sku}`);
  if (!slug || slugs.has(slug)) return `Ligne ${row.line} : l'adresse du produit est déjà utilisée.`;
  const summary = (values.summary || "").slice(0, 400);
  const description = (values.description || "").slice(0, 8000);
  await store.product.create({
    data: {
      name,
      sku,
      slug,
      summary,
      description,
      searchText: fold([name, sku, summary, description, brand.name, category.name].join(" ")),
      brandId: brand.id,
      categoryId: category.id,
      priceGnf,
      availability,
      stockQty,
      leadTimeNote: (values.lead || "").slice(0, 400),
      usageNotes: (values.usageNotes || "").slice(0, 2000),
      installationNotes: (values.installation || "").slice(0, 2000),
      accessoriesNote: (values.accessories || "").slice(0, 2000),
      warrantyNote: (values.warranty || "").slice(0, 1000),
      audience: labels(values.audience || "", fr.audience),
      usage: labels(values.usage || "", fr.usage),
      featured: flag(values.featured, false),
      active: flag(values.active, true),
      isDemo: flag(values.demo, false),
      allowCart: flag(values.cart, true),
      allowQuote: flag(values.quote, true),
      allowQuestion: flag(values.question, true),
      specs: JSON.stringify(parseSpecs((values.specs || "").replace(/\s+\|\s+/g, "\n"))),
    },
  });
  skus.add(sku.toLowerCase());
  slugs.add(slug);
  return "";
}

async function ensureNamed<T extends { id: string; name: string; slug: string }>(
  rows: T[],
  name: string,
  create: (slug: string) => Promise<T>,
) {
  const slug = slugify(name) || `element-${rows.length + 1}`;
  const found = rows.find((row) => fold(row.name) === fold(name) || row.slug === slug);
  if (found) return found;
  const created = await create(slug);
  rows.push(created);
  return created;
}
