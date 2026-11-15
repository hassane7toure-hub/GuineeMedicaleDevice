import type { Metadata } from "next";
import { Confirmation } from "@/components/confirmation";

export const metadata: Metadata = { title: "Demande enregistrée", robots: { index: false, follow: false } };

export default function PrivacyConfirmation() {
  return <Confirmation kind="privacy" title="Demande sur vos données enregistrée" text="Elle sera traitée par une personne autorisée. Le délai exact dépend des obligations applicables, à confirmer juridiquement." />;
}
