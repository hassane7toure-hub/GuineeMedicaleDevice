import type { Metadata } from "next";
import { Confirmation } from "@/components/confirmation";

export const metadata: Metadata = { title: "Demande envoyée", robots: { index: false, follow: false } };

export default function ServiceConfirmation() {
  return (
    <Confirmation
      kind="service"
      title="Demande de service enregistrée"
      text="La demande est en file d'attente. Elle ne confirme ni une date d'intervention ni un délai."
    />
  );
}
