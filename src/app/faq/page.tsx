import type { Metadata } from "next";
import { Editorial, editorialMetadata } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  return editorialMetadata("faq", "Questions fréquentes");
}

export default function FaqPage() {
  return <Editorial slug="faq" />;
}
