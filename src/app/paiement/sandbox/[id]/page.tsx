import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Paiement en ligne retiré", robots: { index: false, follow: false } };

export default function SandboxPage() {
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Paiement en ligne retiré</h1>
        <p className="lede">Le site ne propose plus de paiement en ligne, y compris en simulation. Le règlement se fait hors ligne ou sur facture, puis l'équipe le confirme.</p>
      </header>
      <p><Link href="/commande/suivi">Suivre une commande</Link></p>
    </section>
  );
}
