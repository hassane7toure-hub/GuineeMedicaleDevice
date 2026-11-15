import type { Metadata } from "next";
import { Editorial, editorialMetadata } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  return editorialMetadata("retours", "Retours");
}

export default function ReturnsPage() {
  return <Editorial slug="retours" />;
}
