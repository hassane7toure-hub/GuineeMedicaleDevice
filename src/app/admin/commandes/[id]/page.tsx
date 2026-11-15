import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/nav";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { formatDate, formatGnf } from "@/lib/format";
import { guard } from "@/lib/guard";
import { deliverProforma, updateOrder, updatePayment } from "@/server/admin-actions";

export default async function OrderAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await guard("orders.read");
  const { id } = await params;
  const query = await searchParams;
  const order = await db.order.findUnique({ where: { id }, include: { items: true, payments: { include: { events: true } }, proforma: true } });
  if (!order) notFound();
  return (
    <div>
      <h1>{order.reference}</h1>
      <Flash ok={query.ok} erreur={query.erreur} />
      <p>{order.customerName} · {order.organization} · {order.phone} · {order.email}</p>
      <p>{order.addressLine} {order.area} {order.city}</p>
      <p>{order.deliveryName} · {formatGnf(order.totalGnf)} {order.shippingPending ? "· frais de remise à confirmer" : ""}</p>
      <p className="muted">{formatDate(order.createdAt)}</p>
      <ul>{order.items.map((item) => <li key={item.id}>{item.name} × {item.quantity} · {formatGnf(item.unitPriceGnf)}</li>)}</ul>
      {order.proforma ? <p><a href={`/proforma/${order.proforma.number}`}>Facture proforma {order.proforma.number}</a> · envoi : {order.proforma.sentStatus}</p> : <p>Aucune facture proforma pour cette commande.</p>}
      <form action={deliverProforma}>
        <input type="hidden" name="kind" value="order" />
        <input type="hidden" name="id" value={order.id} />
        {order.proforma ? <input type="hidden" name="resend" value="oui" /> : null}
        <button className="btn-ghost" type="submit">{order.proforma ? "Renvoyer la facture proforma au client" : "Établir et envoyer la facture proforma"}</button>
      </form>
      <form action={updateOrder} className="fields panel" style={{ padding: "1rem" }}>
        <input type="hidden" name="id" value={order.id} />
        <label className="field">État de commande
          <select name="status" defaultValue={order.status}>
            {Object.entries(fr.orderStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">Notes internes<textarea name="notes" defaultValue={order.notes} /></label>
        <button className="btn-primary" type="submit">Mettre à jour la commande</button>
      </form>
      <h2>Paiements</h2>
      <p className="muted">Un passage à « Payé » déclenche la vérification de stock et ne doit être utilisé qu'après contrôle du règlement. Le stock n'est pas réintégré automatiquement en cas de remboursement.</p>
      {order.payments.map((payment) => (
        <form key={payment.id} action={updatePayment} className="fields panel" style={{ padding: "1rem", marginTop: "0.6rem" }}>
          <input type="hidden" name="id" value={payment.id} />
          <p>{payment.provider} · {payment.method} · {formatGnf(payment.amountGnf)} · {fr.paymentStatus[payment.status as keyof typeof fr.paymentStatus]}</p>
          <label className="field">Nouvel état
            <select name="status" defaultValue={payment.status}>
              {Object.entries(fr.paymentStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field">Note interne, sans secret de paiement<input name="note" /></label>
          <button className="btn-ghost" type="submit">Enregistrer le paiement</button>
          <ul>{payment.events.map((event) => <li key={event.id}>{formatDate(event.createdAt)} · {event.type} · {event.status}</li>)}</ul>
        </form>
      ))}
    </div>
  );
}
