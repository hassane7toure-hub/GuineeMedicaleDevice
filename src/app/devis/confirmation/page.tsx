import type { Metadata } from "next";
import { Confirmation } from "@/components/confirmation";

export const metadata: Metadata = { title: "Devis envoyé", robots: { index: false, follow: false } };

export default function QuoteConfirmation() {
  return (
    <Confirmation
      kind="quote"
      title="Demande de devis enregistrée"
      text="L'équipe commerciale la voit dans l'administration. Une facture proforma est établie pour vous. Conservez la référence pour le suivi."
    />
  );
}
