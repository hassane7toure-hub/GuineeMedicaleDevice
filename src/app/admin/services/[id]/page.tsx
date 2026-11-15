import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/nav";
import { fr } from "@/i18n/fr";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { setRequestStatus } from "@/server/admin-actions";

export default async function ServiceAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  await guard("services.write");
  const { id } = await params;
  const query = await searchParams;
  const request = await db.serviceRequest.findUnique({ where: { id } });
  if (!request) notFound();
  return (
    <div>
      <h1>{request.reference}</h1>
      <Flash ok={query.ok} />
      <p>{fr.serviceType[request.serviceType as keyof typeof fr.serviceType]} · {request.equipment}</p>
      <p>{request.location} · {fr.urgency[request.urgency as keyof typeof fr.urgency]}</p>
      <p>{request.name} · {request.organization} · {request.phone} · {request.email}</p>
      <p>{request.description}</p>
      <form action={setRequestStatus} className="fields">
        <input type="hidden" name="kind" value="service" />
        <input type="hidden" name="id" value={request.id} />
        <label className="field">État
          <select name="status" defaultValue={request.status}>
            {["NEW", "IN_REVIEW", "PLANNED", "CLOSED"].map((value) => <option key={value} value={value}>{fr.requestStatus[value as keyof typeof fr.requestStatus]}</option>)}
          </select>
        </label>
        <label className="field">Note interne<textarea name="internalNote" defaultValue={request.internalNote} /></label>
        <button className="btn-primary" type="submit">Enregistrer</button>
      </form>
    </div>
  );
}
