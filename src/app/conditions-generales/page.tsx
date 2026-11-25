import type { Metadata } from "next";
import { Editorial, editorialMetadata } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  return editorialMetadata("conditions-generales", "Conditions générales de vente");
}

export default function TermsPage() {
  return <Editorial slug="conditions-generales" />;
}
