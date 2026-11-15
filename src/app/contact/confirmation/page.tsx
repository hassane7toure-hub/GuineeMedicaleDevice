import type { Metadata } from "next";
import { Confirmation } from "@/components/confirmation";

export const metadata: Metadata = { title: "Message envoyé", robots: { index: false, follow: false } };

export default function ContactConfirmation() {
  return <Confirmation kind="contact" title="Message enregistré" text="L'équipe peut le lire dans l'administration. L'e-mail automatique n'est envoyé que si le SMTP est configuré." />;
}
