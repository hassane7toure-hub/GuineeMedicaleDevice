import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fr } from "@/i18n/fr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatGnf } from "@/lib/format";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/compte/connexion?next=/compte/commandes");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <section className="section wrap">
      <header className="page-intro"><h1>Mes commandes</h1></header>
      {orders.length === 0 ? <p>Aucune commande liée à ce compte. Une commande invitée n'est pas rattachée automatiquement.</p> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Référence</th><th>Date</th><th>Total</th><th>État</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/commande/${order.reference}`}>{order.reference}</Link></td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{formatGnf(order.totalGnf)}</td>
                  <td>{fr.orderStatus[order.status as keyof typeof fr.orderStatus]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
