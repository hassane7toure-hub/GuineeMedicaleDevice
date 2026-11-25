import Link from "next/link";
import { Flash } from "@/components/admin/nav";
import { ImportNotice, SheetExchange } from "@/components/admin/sheet-exchange";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { formatGnf } from "@/lib/format";
import { guard } from "@/lib/guard";
import { importProducts } from "@/server/admin-actions";

export default async function ProductsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; crees?: string; ignores?: string; detail?: string }>;
}) {
  await guard("catalog.write");
  const query = await searchParams;
  const products = await db.product.findMany({ include: { brand: true, category: true }, orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="kicker"><h1>Produits</h1><Link className="btn-primary" href="/admin/produits/nouveau">Nouveau</Link></div>
      {query.ok === "import" ? <ImportNotice {...query} noun="produit" /> : <Flash ok={query.ok} erreur={query.erreur} />}
      <SheetExchange
        heading="Fichier"
        help="Importez de nouveaux produits. Une marque ou une catégorie inconnue est créée. Une référence déjà présente est ignorée, sans modifier le produit existant. Les colonnes utiles sont le nom, la référence, la marque, la catégorie, le prix en GNF, la disponibilité, le stock et les textes de la fiche."
        action={importProducts}
        csvHref="/api/admin/export?type=products&format=csv"
        xlsxHref="/api/admin/export?type=products&format=xlsx"
        modelCsv="/api/admin/export?type=products&format=csv&modele=1"
        modelXlsx="/api/admin/export?type=products&format=xlsx&modele=1"
      />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nom</th><th>SKU</th><th>Prix</th><th>État</th><th>Public</th></tr></thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td><Link href={`/admin/produits/${product.id}`}>{product.name}</Link>{product.isDemo ? " · démo" : ""}</td>
                <td>{product.sku}</td>
                <td>{formatGnf(product.priceGnf) || "Devis"}</td>
                <td>{fr.availability[product.availability as keyof typeof fr.availability]}</td>
                <td>{product.active ? "Oui" : "Non"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
