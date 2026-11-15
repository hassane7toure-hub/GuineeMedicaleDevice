import { Flash } from "@/components/admin/nav";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { guard } from "@/lib/guard";
import { setRequestStatus } from "@/server/admin-actions";

export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await guard("messages.read");
  const query = await searchParams;
  const [messages, privacy] = await Promise.all([
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.privacyRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return (
    <div>
      <h1>Messages et données personnelles</h1>
      <Flash ok={query.ok} />
      <h2>Contact</h2>
      {messages.map((message) => (
        <form key={message.id} action={setRequestStatus} className="panel fields" style={{ padding: "1rem", marginBottom: "0.6rem" }}>
          <input type="hidden" name="kind" value="contact" />
          <input type="hidden" name="id" value={message.id} />
          <p><strong>{message.reference}</strong> · {formatDate(message.createdAt)} · {message.subject}</p>
          <p>{message.name} · {message.email} · {message.phone}</p>
          <p>{message.message}</p>
          <label className="field">État
            <select name="status" defaultValue={message.status}>
              <option value="NEW">Nouvelle</option>
              <option value="IN_REVIEW">En cours</option>
              <option value="CLOSED">Clôturée</option>
            </select>
          </label>
          <button className="btn-ghost" type="submit">Enregistrer</button>
        </form>
      ))}
      <h2>Confidentialité</h2>
      {privacy.map((request) => (
        <form key={request.id} action={setRequestStatus} className="panel fields" style={{ padding: "1rem", marginBottom: "0.6rem" }}>
          <input type="hidden" name="kind" value="privacy" />
          <input type="hidden" name="id" value={request.id} />
          <p><strong>{request.reference}</strong> · {request.type} · {formatDate(request.createdAt)}</p>
          <p>{request.name} · {request.email}</p>
          <p>{request.message}</p>
          <label className="field">État
            <select name="status" defaultValue={request.status}>
              <option value="NEW">Nouvelle</option>
              <option value="IN_REVIEW">En cours</option>
              <option value="CLOSED">Clôturée</option>
            </select>
          </label>
          <button className="btn-ghost" type="submit">Enregistrer</button>
        </form>
      ))}
    </div>
  );
}
