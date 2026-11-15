import { ProductForm } from "@/components/admin/product-form";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";

export default async function NewProductPage() {
  await guard("catalog.write");
  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div>
      <h1>Nouveau produit</h1>
      <p className="muted">N'ajoutez une photographie que si vous en avez les droits. Le texte alternatif est obligatoire.</p>
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
