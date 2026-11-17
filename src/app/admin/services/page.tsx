import Link from "next/link";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { guard } from "@/lib/guard";
import { can } from "@/lib/permissions";

export default async function ServicesAdmin() {
  const user = await guard("services.write");
  const requests = await db.serviceRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <div className="kicker"><h1>Services</h1>{can(user.role, "export") ? <a className="btn-ghost" href="/api/admin/export?type=services">Exporter</a> : null}</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Référence</th><th>Type</th><th>Lieu</th><th>Urgence</th><th>État</th></tr></thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td><Link href={`/admin/services/${request.id}`}>{request.reference}</Link><div className="meta">{formatDate(request.createdAt)}</div></td>
                <td>{fr.serviceType[request.serviceType as keyof typeof fr.serviceType]}</td>
                <td>{request.location}</td>
                <td>{fr.urgency[request.urgency as keyof typeof fr.urgency]}</td>
                <td>{fr.requestStatus[request.status as keyof typeof fr.requestStatus] || request.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
