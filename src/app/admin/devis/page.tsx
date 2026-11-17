import Link from "next/link";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { guard } from "@/lib/guard";
import { can } from "@/lib/permissions";

export default async function QuotesAdmin() {
  const user = await guard("quotes.write");
  const quotes = await db.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <div className="kicker"><h1>Devis</h1>{can(user.role, "export") ? <a className="btn-ghost" href="/api/admin/export?type=quotes">Exporter</a> : null}</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Référence</th><th>Organisation</th><th>Ville</th><th>État</th></tr></thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td><Link href={`/admin/devis/${quote.id}`}>{quote.reference}</Link><div className="meta">{formatDate(quote.createdAt)}</div></td>
                <td>{quote.organization || quote.name}</td>
                <td>{quote.city}</td>
                <td>{fr.requestStatus[quote.status as keyof typeof fr.requestStatus] || quote.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
