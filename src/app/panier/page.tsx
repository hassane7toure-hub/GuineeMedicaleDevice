import type { Metadata } from "next";
import Link from "next/link";
import { PriceTag } from "@/components/price-tag";
import { getCart, linePurchasable } from "@/lib/cart";
import { gnfNumber } from "@/lib/format";
import { updateCart } from "@/server/public-actions";

export const metadata: Metadata = { title: "Panier", robots: { index: false, follow: false } };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const cart = await getCart();
  const items = cart?.items ?? [];
  let subtotal = 0;
  return (
    <section className="section wrap">
      <header className="page-intro"><h1>Panier</h1></header>
      {erreur === "stock" ? <p className="error" role="alert">La quantité dépasse le stock suivi.</p> : null}
      {items.length === 0 ? (
        <p className="panel" style={{ padding: "1rem" }}>Le panier est vide. <Link href="/boutique">Parcourir la boutique</Link> ou <Link href="/devis">demander un devis</Link>.</p>
      ) : (
        <div className="grid-2">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Article</th><th>Quantité</th><th>Prix</th></tr></thead>
              <tbody>
                {items.map((item) => {
                  const unit = gnfNumber(item.product.priceGnf);
                  const ok = linePurchasable(item) && unit !== null;
                  if (ok && unit !== null) subtotal += unit * item.quantity;
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/produit/${item.product.slug}`}>{item.product.name}</Link>
                        <div className="meta">{item.product.sku}</div>
                        {!ok ? <div className="error">Plus commandable en l'état.</div> : null}
                      </td>
                      <td>
                        <form action={updateCart} style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input name="quantity" type="number" min={0} max={99} defaultValue={item.quantity} aria-label={`Quantité de ${item.product.name}`} style={{ width: "4.5rem" }} />
                          <button className="btn-ghost" type="submit">Mettre à jour</button>
                        </form>
                      </td>
                      <td>{ok && unit !== null ? <PriceTag amount={unit * item.quantity} demo={item.product.isDemo} /> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <aside className="panel" style={{ padding: "1rem" }}>
            <h2>Estimation</h2>
            <p>Sous-total des articles encore commandables.</p>
            <PriceTag amount={subtotal} />
            <p className="muted">Les frais de remise sont calculés à l'étape suivante, selon l'option choisie. Une option marquée « à confirmer » n'est pas ajoutée au total.</p>
            <Link className="btn-primary" href="/commande">Passer à la commande</Link>
          </aside>
        </div>
      )}
    </section>
  );
}
