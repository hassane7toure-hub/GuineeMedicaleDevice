import Link from "next/link";
import { db } from "@/lib/db";
import { readNotice } from "@/lib/notice";
import { proformaSendNote } from "@/lib/proforma";

export async function Confirmation({
  kind,
  title,
  text,
}: {
  kind: string;
  title: string;
  text: string;
}) {
  const notice = await readNotice();
  const reference = notice?.kind === kind ? notice.reference : null;
  const proforma = reference && kind === "quote"
    ? await db.proforma.findFirst({ where: { quote: { reference } } })
    : null;
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>{title}</h1>
      </header>
      {reference ? (
        <p className="notice">Référence : <strong>{reference}</strong></p>
      ) : (
        <p>Aucune demande récente dans cette session. Si vous venez d'envoyer un formulaire, rechargez depuis le même navigateur.</p>
      )}
      <p>{text}</p>
      {proforma ? (
        <p className="notice">
          {proformaSendNote(proforma.sentStatus)}{" "}
          <Link href={`/proforma/${proforma.number}`}>Ouvrir la facture proforma</Link>
        </p>
      ) : null}
    </section>
  );
}
