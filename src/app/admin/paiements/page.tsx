import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { formatDate, formatGnf } from "@/lib/format";
import { guard } from "@/lib/guard";

export default async function PaymentsAdmin() {
  await guard("orders.read");
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { order: true } });
  return (
    <div>
      <h1>Paiements</h1>
      <div className="warn">
        <p>Le site ne propose pas de paiement en ligne. Le client choisit le règlement hors ligne ou sur facture.</p>
        <p>Un paiement n'est marqué payé qu'après enregistrement par une personne autorisée.</p>
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
