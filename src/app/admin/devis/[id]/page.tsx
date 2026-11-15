import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/nav";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { deliverProforma, setRequestStatus } from "@/server/admin-actions";

export default async function QuoteAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  await guard("quotes.write");
  const { id } = await params;
  const query = await searchParams;
  const quote = await db.quoteRequest.findUnique({ where: { id }, include: { items: true, attachments: true, proforma: true } });
  if (!quote) notFound();
  return (
    <div>
      <h1>{quote.reference}</h1>
      <Flash ok={query.ok} />
      <p>{quote.name} · {quote.roleTitle} · {quote.organization}</p>
      <p>{quote.phone} · {quote.email} · {quote.city}</p>
      <p>{quote.need}</p>
      <ul>{quote.items.map((item) => <li key={item.id}>{item.name} × {item.quantity}</li>)}</ul>
      {quote.proforma ? <p><a href={`/proforma/${quote.proforma.number}`}>Facture proforma {quote.proforma.number}</a> · envoi : {quote.proforma.sentStatus}</p> : <p>Aucune facture proforma pour cette demande.</p>}
      <form action={deliverProforma}>
        <input type="hidden" name="kind" value="quote" />
        <input type="hidden" name="id" value={quote.id} />
        {quote.proforma ? <input type="hidden" name="resend" value="oui" /> : null}
        <button className="btn-ghost" type="submit">{quote.proforma ? "Renvoyer la facture proforma au client" : "Établir et envoyer la facture proforma"}</button>
      </form>
      <ul>{quote.attachments.map((file) => <li key={file.id}><a href={`/api/pieces/${file.id}`}>{file.originalName}</a></li>)}</ul>
      <form action={setRequestStatus} className="fields">
        <input type="hidden" name="kind" value="quote" />
        <input type="hidden" name="id" value={quote.id} />
        <label className="field">État
          <select name="status" defaultValue={quote.status}>
            {Object.entries(fr.requestStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">Note interne<textarea name="internalNote" defaultValue={quote.internalNote} /></label>
        <button className="btn-primary" type="submit">Enregistrer</button>
      </form>
    </div>
  );
}
