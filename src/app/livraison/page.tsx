import type { Metadata } from "next";
import { Editorial, editorialMetadata } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  return editorialMetadata("livraison", "Livraison");
}

export default function DeliveryInfoPage() {
  return <Editorial slug="livraison" />;
}
