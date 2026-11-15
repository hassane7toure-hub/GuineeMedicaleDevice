import type { Metadata } from "next";
import { Editorial, editorialMetadata } from "@/components/editorial";
import { PrivacyForm } from "@/components/forms";

export async function generateMetadata(): Promise<Metadata> {
  return editorialMetadata("confidentialite", "Confidentialité");
}

export default function PrivacyPage() {
  return (
    <>
      <Editorial slug="confidentialite" />
      <section className="section wrap">
        <h2>Demande d'accès, de correction ou de suppression</h2>
        <PrivacyForm />
      </section>
    </>
  );
}
