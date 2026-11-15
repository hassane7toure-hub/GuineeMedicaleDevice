import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatGnf } from "@/lib/format";
import { sandboxTokenValid } from "@/lib/payments/provider";
import { simulatePayment } from "@/server/public-actions";

export default async function SandboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  if (process.env.PAYMENT_MODE === "live") notFound();
  const { id } = await params;
  const { token = "" } = await searchParams;
  if (!sandboxTokenValid(id, token)) redirect("/");
  const payment = await db.payment.findUnique({ where: { id }, include: { order: true } });
  if (!payment || payment.provider !== "sandbox") notFound();
  return (
    <section className="section wrap">
      <div className="warn">Page de paiement simulée. Aucun débit n'est effectué. Aucune donnée de carte ni code secret n'est demandé. En production, cette étape est hébergée par le prestataire.</div>
      <header className="page-intro">
        <p className="eyebrow">Mode test</p>
        <h1>Simulation de paiement</h1>
        <p className="lede">Commande {payment.order.reference} · {formatGnf(payment.amountGnf)} · {payment.method}</p>
      </header>
      <form action={simulatePayment} className="fields" style={{ maxWidth: "32rem" }}>
        <input type="hidden" name="paymentId" value={payment.id} />
        <input type="hidden" name="token" value={token} />
        <button className="btn-primary" name="outcome" value="paid" type="submit">Simuler un paiement réussi</button>
        <button className="btn-ghost" name="outcome" value="failed" type="submit">Simuler un échec</button>
        <button className="btn-ghost" name="outcome" value="cancelled" type="submit">Simuler une annulation</button>
        <button className="btn-ghost" name="outcome" value="review" type="submit">Laisser à vérifier</button>
      </form>
    </section>
  );
}
