import type { Metadata } from "next";
import { InfoPoster } from "@/components/info-poster";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "À propos",
  description: "Guinea Medical Device : vente, installation, maintenance et conseil en équipements médicaux en République de Guinée.",
  alternates: { canonical: "/a-propos" },
};

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <section className="section wrap">
      <header className="page-intro">
        <p className="eyebrow">{settings.country}</p>
        <h1>{settings.companyName}</h1>
        <p className="lede">{settings.intro}</p>
      </header>
      <div className="grid-2">
        <article className="card">
          <h2>Ce que fait l'entreprise</h2>
          <p>La vente et la fourniture d'équipements, l'installation et la mise en service, la maintenance préventive et corrective, et le conseil technique pour le choix du matériel.</p>
          <p className="muted">Cette présentation reprend l'activité déclarée. Elle ne cite ni client, ni certification, ni partenariat tant qu'ils ne sont pas ajoutés dans les contenus.</p>
        </article>
        <article className="card">
          <h2>Identité</h2>
          <p>{settings.legalName}</p>
          <p className="warn">{settings.legalNameNote}</p>
          <h2>Équipe</h2>
          <p>Les noms, fonctions et portraits sont à ajouter par l'entreprise. Aucune personne n'est inventée ici.</p>
          <h2>Intervention</h2>
          <p>{settings.interventionAreas || "Zones non renseignées."}</p>
          <InfoPoster />
        </article>
      </div>
    </section>
  );
}
