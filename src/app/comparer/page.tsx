import type { Metadata } from "next";
import Link from "next/link";
import { Availability } from "@/components/availability";
import { PriceTag } from "@/components/price-tag";
import { getProduct } from "@/lib/catalog";

export const metadata: Metadata = { title: "Comparer des équipements", robots: { index: false, follow: false } };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids = "" } = await searchParams;
  const slugs = Array.from(new Set(ids.split(",").map((item) => item.trim()).filter(Boolean))).slice(0, 3);
  const products = (await Promise.all(slugs.map((slug) => getProduct(slug)))).filter((item) => item !== null);
  const labels = Array.from(new Set(products.flatMap((product) => product.specs.map((spec) => spec.label))));
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Comparer</h1>
        <p className="lede">Jusqu'à trois fiches. Depuis une fiche produit, le bouton Comparer mémorise la sélection dans ce navigateur.</p>
      </header>
      {products.length === 0 ? (
        <p>Aucun produit sélectionné. <Link href="/boutique">Ouvrir la boutique</Link>.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Critère</th>
                {products.map((product) => <th key={product.slug}><Link href={`/produit/${product.slug}`}>{product.name}</Link></th>)}
              </tr>
            </thead>
            <tbody>
              <tr><td>Référence</td>{products.map((product) => <td key={product.slug}>{product.sku}</td>)}</tr>
              <tr><td>Marque</td>{products.map((product) => <td key={product.slug}>{product.brandName}</td>)}</tr>
              <tr><td>Disponibilité</td>{products.map((product) => <td key={product.slug}><Availability value={product.availability} /></td>)}</tr>
              <tr><td>Prix</td>{products.map((product) => <td key={product.slug}><PriceTag amount={product.priceGnf} demo={product.isDemo} /></td>)}</tr>
              {labels.map((label) => (
                <tr key={label}>
                  <td>{label}</td>
                  {products.map((product) => <td key={product.slug}>{product.specs.find((spec) => spec.label === label)?.value || "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
