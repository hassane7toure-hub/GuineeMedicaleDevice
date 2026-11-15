import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { guard } from "@/lib/guard";

export default async function AuditAdmin() {
  await guard("audit.read");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true } });
  return (
    <div>
      <h1>Journal</h1>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Quand</th><th>Qui</th><th>Action</th><th>Cible</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{log.user?.email || "système"}</td>
                <td>{log.action}</td>
                <td>{log.entity} {log.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
