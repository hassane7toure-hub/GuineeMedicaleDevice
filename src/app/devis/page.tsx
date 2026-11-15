import type { Metadata } from "next";
import { QuoteForm } from "@/components/forms";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Demande de devis",
  description: "Demandez un devis pour un ou plusieurs équipements médicaux, ou décrivez un besoin libre.",
  alternates: { canonical: "/devis" },
};

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const { produit = "" } = await searchParams;
  const products = await db.product.findMany({
    where: { active: true },
    select: { slug: true, name: true, sku: true },
    orderBy: { name: "asc" },
  });
  return (
    <section className="section wrap">
      <header className="page-intro">
        <p className="eyebrow">Commercial</p>
        <h1>Demander un devis</h1>
        <p className="lede">Sélectionnez des produits du catalogue ou décrivez un besoin libre. Vous recevez une référence de suivi. L'envoi d'e-mail automatique dépend de la messagerie configurée.</p>
      </header>
      <QuoteForm products={products} selected={produit} />
    </section>
  );
}
