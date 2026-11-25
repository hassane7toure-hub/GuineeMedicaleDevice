import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/forms";
import { PriceTag } from "@/components/price-tag";
import { currentUser } from "@/lib/auth";
import { getCart, linePurchasable } from "@/lib/cart";
import { db } from "@/lib/db";
import { formatGnf, gnfNumber } from "@/lib/format";
import { availableMethods } from "@/lib/payments/methods";

export const metadata: Metadata = { title: "Commande", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const cart = await getCart();
  if (!cart || cart.items.length === 0) redirect("/panier");
  const [options, methods, user] = await Promise.all([
    db.deliveryOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    availableMethods(),
    currentUser(),
  ]);
  let subtotal = 0;
  for (const item of cart.items) {
    const unit = gnfNumber(item.product.priceGnf);
    if (linePurchasable(item) && unit !== null) subtotal += unit * item.quantity;
  }
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Commande</h1>
        <p className="lede">Vous pouvez commander sans compte. Le règlement se fait hors ligne ou sur facture. Aucun paiement en ligne n'est proposé. La validation de la commande vaut prise de connaissance des <Link href="/conditions-generales">conditions générales de vente</Link>.</p>
      </header>
      {methods.length === 0 ? (
        <p className="warn">Aucun mode de règlement n'est activé. <Link href="/devis">Demandez un devis</Link> ou faites activer un mode dans l'administration.</p>
      ) : (
        <div className="grid-2">
          <CheckoutForm
            idempotencyKey={crypto.randomUUID()}
            options={options.map((option) => ({
              id: option.id,
              name: option.name,
              description: option.description,
              delayNote: option.delayNote,
              isDemo: option.isDemo,
              feeLabel: option.feePending || option.feeGnf === null ? "Frais à confirmer" : formatGnf(option.feeGnf) || "0 GNF",
            }))}
            methods={methods}
            account={user ? { name: user.name, email: user.email, phone: user.phone, organization: user.organization, city: user.city } : null}
          />
          <aside className="panel" style={{ padding: "1rem" }}>
            <h2>Articles</h2>
            <ul>
              {cart.items.map((item) => (
                <li key={item.id}>{item.product.name} × {item.quantity}</li>
              ))}
            </ul>
            <PriceTag amount={subtotal} />
            <p className="muted">Le total définitif, frais connus inclus, apparaît sur le récapitulatif.</p>
          </aside>
        </div>
      )}
    </section>
  );
}
