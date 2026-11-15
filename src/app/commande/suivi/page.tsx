import type { Metadata } from "next";
import { LookupForm } from "@/components/forms";

export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false, follow: false } };

export default function OrderLookupPage() {
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Suivre une commande</h1>
        <p className="lede">Indiquez la référence et l'e-mail utilisés. Aucune information n'est affichée si les deux ne correspondent pas.</p>
      </header>
      <LookupForm />
    </section>
  );
}
