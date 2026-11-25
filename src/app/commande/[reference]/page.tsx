import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fr } from "@/i18n/fr";
import { currentUser } from "@/lib/auth";
import { formatDate, formatGnf } from "@/lib/format";
import { canAccessOrder } from "@/lib/notice";
import { availableMethods } from "@/lib/payments/methods";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { proformaSendNote } from "@/lib/proforma";
import { startPayment } from "@/server/public-actions";

export const metadata: Metadata = { title: "Récapitulatif de commande", robots: { index: false, follow: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ erreur?: string; info?: string }>;
}) {
  const { reference } = await params;
  const query = await searchParams;
  const order = await db.order.findUnique({ where: { reference }, include: { items: true, payments: { orderBy: { createdAt: "desc" } }, proforma: true } });
  if (!order) notFound();
  const user = await currentUser();
  const allowed = (user && user.id === order.userId) || (user && can(user.role, "orders.read")) || (await canAccessOrder(reference));
  if (!allowed) redirect("/commande/suivi");
  const methods = await availableMethods();
  const paid = order.payments.some((payment) => payment.status === "PAID");
  return (
    <section className="section wrap">
      <header className="page-intro">
        <p className="eyebrow">Commande</p>
        <h1>{order.reference}</h1>
        <p className="lede">Passée le {formatDate(order.createdAt)} · {fr.orderStatus[order.status as keyof typeof fr.orderStatus] || order.status}</p>
      </header>
      {query.info === "hors-ligne" ? <p className="notice">Demande de règlement hors ligne enregistrée. La commande n'est pas marquée payée tant qu'une personne autorisée ne l'a pas vérifiée.</p> : null}
      {query.erreur === "prestataire" ? <p className="error">Le prestataire n'a pas ouvert le paiement. La commande est conservée : vous pouvez réessayer ou choisir un autre mode.</p> : null}
      {query.erreur === "moyen" ? <p className="error">Ce mode de règlement n'est pas disponible.</p> : null}
      <div className="grid-2">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Article</th><th>Qté</th><th>Prix unitaire</th></tr></thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}><td>{item.name}<div className="meta">{item.sku}</div></td><td>{item.quantity}</td><td>{formatGnf(item.unitPriceGnf)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="panel" style={{ padding: "1rem" }}>
          <p>Sous-total : {formatGnf(order.subtotalGnf)}</p>
          <p>{order.shippingPending ? "Frais de remise : à confirmer, non ajoutés." : `Frais de remise : ${formatGnf(order.shippingGnf)}`}</p>
          <p><strong>Total connu : {formatGnf(order.totalGnf)}</strong></p>
          {order.proforma ? (
            <p className="notice">{proformaSendNote(order.proforma.sentStatus)} <Link href={`/proforma/${order.proforma.number}`}>Ouvrir la facture proforma</Link></p>
          ) : null}
          <p className="muted">{order.deliveryName} · {order.city}{order.addressLine ? ` · ${order.addressLine}` : ""}</p>
          <p className="muted">{order.customerName} · {order.phone} · {order.email}</p>
          {order.createAccount && !order.userId ? <p className="warn">Le compte n'a pas été créé : un compte existe déjà avec cet e-mail. La commande reste enregistrée.</p> : null}
          {!paid && ["PENDING_PAYMENT", "AWAITING_REVIEW"].includes(order.status) ? (
            <form action={startPayment} className="fields">
              <input type="hidden" name="reference" value={order.reference} />
              <fieldset>
                <legend>Choisir le règlement</legend>
                {methods.map((method) => (
                  <label key={method.id} className="check">
                    <input type="radio" name="method" value={method.id} defaultChecked={method.id === order.intendedMethod} required />
                    <span><strong>{method.label}</strong><br /><span className="muted">{method.detail}</span></span>
                  </label>
                ))}
              </fieldset>
              <button className="btn-primary" type="submit">Confirmer le règlement hors ligne</button>
            </form>
          ) : null}
          {paid ? <p className="notice">Paiement vérifié côté serveur. La commande est confirmée.</p> : null}
          <h2>Paiements</h2>
          <ul>
            {order.payments.length === 0 ? <li>Aucun paiement lancé.</li> : order.payments.map((payment) => (
              <li key={payment.id}>{payment.method} · {fr.paymentStatus[payment.status as keyof typeof fr.paymentStatus]} · {formatGnf(payment.amountGnf)}</li>
            ))}
          </ul>
          <p><Link href="/contact">Contacter l'équipe</Link></p>
        </aside>
      </div>
    </section>
  );
}
