import Link from "next/link";
import { Flash } from "@/components/admin/nav";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { formatDate, formatGnf } from "@/lib/format";
import { guard } from "@/lib/guard";

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await guard("orders.read");
  const query = await searchParams;
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <div>
      <div className="kicker"><h1>Commandes</h1><a className="btn-ghost" href="/api/admin/export?type=orders">Exporter</a></div>
      <Flash ok={query.ok} erreur={query.erreur} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Référence</th><th>Client</th><th>Total</th><th>État</th><th>Paiement</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/admin/commandes/${order.id}`}>{order.reference}</Link><div className="meta">{formatDate(order.createdAt)}</div></td>
                <td>{order.customerName}<div className="meta">{order.city}</div></td>
                <td>{formatGnf(order.totalGnf)}</td>
                <td>{fr.orderStatus[order.status as keyof typeof fr.orderStatus]}</td>
                <td>{order.payments[0] ? fr.paymentStatus[order.payments[0].status as keyof typeof fr.paymentStatus] : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
