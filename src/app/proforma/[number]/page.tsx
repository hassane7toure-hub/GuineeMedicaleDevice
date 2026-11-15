import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatGnf } from "@/lib/format";
import { canAccessOrder, readNotice } from "@/lib/notice";
import { can } from "@/lib/permissions";
import { parseProformaLines, proformaSendNote } from "@/lib/proforma";
import { readScoped } from "@/lib/session-token";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Facture proforma",
  robots: { index: false, follow: false },
};

export default async function ProformaPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ acces?: string }>;
}) {
  const { number } = await params;
  const query = await searchParams;
  const proforma = await db.proforma.findUnique({
    where: { number },
    include: {
      order: { select: { reference: true, userId: true } },
      quote: { select: { reference: true, userId: true } },
    },
  });
  if (!proforma) notFound();
  const token = await readScoped("proforma", query.acces);
  const user = await currentUser();
  const notice = await readNotice();
  const allowed =
    (typeof token?.number === "string" && token.number === proforma.number) ||
    (user && proforma.kind === "ORDER" && can(user.role, "orders.read")) ||
    (user && proforma.kind === "QUOTE" && can(user.role, "quotes.write")) ||
    (user && proforma.order?.userId && user.id === proforma.order.userId) ||
    (user && proforma.quote?.userId && user.id === proforma.quote.userId) ||
    (proforma.order ? await canAccessOrder(proforma.order.reference) : false) ||
    (notice?.kind === "quote" && notice.reference === proforma.quote?.reference);
  if (!allowed) notFound();

  const settings = await getSettings();
  const lines = parseProformaLines(proforma.lines);
  const linked = proforma.kind === "ORDER" ? "Commande" : "Demande de devis";
  const back = proforma.kind === "ORDER" ? `/commande/${proforma.sourceReference}` : "/devis/confirmation";

  return (
    <section className="section wrap">
      <p className="notice no-print">{proformaSendNote(proforma.sentStatus)}</p>
      <article className="proforma">
        <header className="proforma-head">
          <div>
            <p className="eyebrow">Facture proforma</p>
            <h1>{proforma.number}</h1>
            <p>Établie le {formatDate(proforma.createdAt)}</p>
          </div>
          <div>
            <strong>{settings.legalName || settings.companyName}</strong>
            <p>{[settings.address, settings.city, settings.country].filter(Boolean).join(", ")}</p>
            <p>{[settings.phone, settings.email].filter(Boolean).join(" · ")}</p>
          </div>
        </header>
        <p className="warn">Ce document n'est pas une facture définitive et n'atteste pas un paiement.</p>
        <div className="grid-2">
          <section>
            <h2>Client</h2>
            <p>{proforma.customerName}{proforma.organization ? ` · ${proforma.organization}` : ""}</p>
            <p>{[proforma.addressLine, proforma.city].filter(Boolean).join(", ")}</p>
            <p>{proforma.phone} · {proforma.email}</p>
          </section>
          <section>
            <h2>Origine</h2>
            <p>{linked} {proforma.sourceReference}</p>
            {proforma.deliveryName ? <p>Remise : {proforma.deliveryName}</p> : null}
          </section>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Désignation</th><th>Référence</th><th>Qté</th><th>Prix unitaire</th><th>Montant</th></tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const unit = line.unitPriceGnf ? BigInt(line.unitPriceGnf) : null;
                const amount = unit === null || line.pending ? null : unit * BigInt(line.quantity);
                return (
                  <tr key={`${line.sku}-${index}`}>
                    <td>{line.name}{line.demo ? <span className="badge badge-demo">Démonstration</span> : null}</td>
                    <td>{line.sku || "—"}</td>
                    <td>{line.quantity}</td>
                    <td>{line.pending || unit === null ? "À confirmer" : formatGnf(unit)}</td>
                    <td>{amount === null ? "À confirmer" : formatGnf(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>Sous-total : {proforma.subtotalGnf === null ? "À confirmer" : formatGnf(proforma.subtotalGnf)}</p>
        {proforma.kind === "ORDER" ? (
          <p>Frais de remise : {proforma.shippingPending ? "À confirmer, non ajoutés." : formatGnf(proforma.shippingGnf)}</p>
        ) : null}
        <p><strong>Total : {proforma.pricePending || proforma.totalGnf === null ? "À confirmer" : formatGnf(proforma.totalGnf)}</strong></p>
        {proforma.pricePending ? <p className="muted">Certaines lignes n'ont pas de prix au catalogue. L'équipe les confirmera avant un accord.</p> : null}
        {proforma.includesDemo || settings.demoMode ? <p className="warn">Des éléments de démonstration figurent sur ce document ou le site est encore en démonstration. Les montants ne constituent pas une offre contractuelle.</p> : null}
        <p className="muted">Les conditions de livraison, de garantie et de retour sont celles publiées sur le site, sous réserve de la confirmation de l'équipe.</p>
        <p className="no-print"><PrintButton /> <Link href={back}>Retour</Link></p>
      </article>
    </section>
  );
}
