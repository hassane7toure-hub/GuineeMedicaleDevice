import Link from "next/link";
import { Flash } from "@/components/admin/nav";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { formatGnf } from "@/lib/format";
import { guard } from "@/lib/guard";

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await guard("catalog.write");
  const query = await searchParams;
  const products = await db.product.findMany({ include: { brand: true, category: true }, orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="kicker"><h1>Produits</h1><Link className="btn-primary" href="/admin/produits/nouveau">Nouveau</Link></div>
      <Flash ok={query.ok} erreur={query.erreur} />
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
