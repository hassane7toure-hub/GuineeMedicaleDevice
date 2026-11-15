import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/nav";
import { ProductForm } from "@/components/admin/product-form";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { specsToText } from "@/lib/text";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await guard("catalog.write");
  const { id } = await params;
  const query = await searchParams;
  const [product, brands, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: true } }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <div>
      <h1>{product.name}</h1>
      <Flash ok={query.ok} erreur={query.erreur} />
      <ProductForm
        brands={brands}
        categories={categories}
        product={{
          ...product,
          priceGnf: product.priceGnf === null ? "" : String(product.priceGnf),
          stockQty: product.stockQty === null ? "" : String(product.stockQty),
          specs: specsToText(product.specs),
          images: product.images,
        }}
      />
    </div>
  );
}
