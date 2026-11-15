import type { Metadata } from "next";
import { Editorial, editorialMetadata } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  return editorialMetadata("mentions-legales", "Mentions légales");
}

export default function LegalPage() {
  return <Editorial slug="mentions-legales" />;
}
