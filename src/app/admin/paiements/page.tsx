import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { formatDate, formatGnf } from "@/lib/format";
import { guard } from "@/lib/guard";
import { cinetpayBlockers, cinetpayConfigured, paymentMode } from "@/lib/payments/provider";

export default async function PaymentsAdmin() {
  await guard("orders.read");
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { order: true } });
  return (
    <div>
      <h1>Paiements</h1>
      <div className="warn">
        <p>Mode actuel : {paymentMode() === "test" ? "test. Les boutons Orange Money et Visa du parcours sont des simulations, sans débit." : "live."}</p>
        <p>{cinetpayConfigured() ? "CinetPay peut être appelé." : cinetpayBlockers().join(" ")}</p>
        <p>Les numéros de carte et les codes secrets ne sont ni demandés ni stockés. Un paiement n'est marqué payé qu'après vérification serveur.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Commande</th><th>Moyen</th><th>Montant</th><th>État</th></tr></thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{formatDate(payment.createdAt)}</td>
                <td>{payment.order.reference}</td>
                <td>{payment.method}<div className="meta">{payment.provider}</div></td>
                <td>{formatGnf(payment.amountGnf)}</td>
                <td>{fr.paymentStatus[payment.status as keyof typeof fr.paymentStatus]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
