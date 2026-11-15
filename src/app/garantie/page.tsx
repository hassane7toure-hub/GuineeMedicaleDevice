import type { Metadata } from "next";
import { Editorial, editorialMetadata } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  return editorialMetadata("garantie", "Garantie");
}

export default function WarrantyPage() {
  return <Editorial slug="garantie" />;
}
