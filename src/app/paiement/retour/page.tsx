import Link from "next/link";
import { redirect } from "next/navigation";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { canAccessOrder } from "@/lib/notice";

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference = "" } = await searchParams;
  if (!reference) redirect("/commande/suivi");
  const order = await db.order.findUnique({ where: { reference }, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order) redirect("/commande/suivi");
  const allowed = await canAccessOrder(reference);
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Retour de paiement</h1>
        <p className="lede">Cette page n'enregistre pas un paiement. Le site ne propose pas de paiement en ligne. Le règlement hors ligne est confirmé par l'équipe.</p>
      </header>
      {allowed ? (
        <>
          <p>Commande {order.reference} · {fr.orderStatus[order.status as keyof typeof fr.orderStatus]}</p>
          <p>Dernier paiement : {order.payments[0] ? fr.paymentStatus[order.payments[0].status as keyof typeof fr.paymentStatus] : "aucun"}</p>
          <Link className="btn-primary" href={`/commande/${order.reference}`}>Voir le récapitulatif</Link>
        </>
      ) : (
        <p>Ouvrez le suivi avec votre référence et votre e-mail pour consulter l'état.</p>
      )}
    </section>
  );
}
