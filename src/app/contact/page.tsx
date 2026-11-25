import type { Metadata } from "next";
import { ContactLines } from "@/components/contact-lines";
import { ContactForm } from "@/components/forms";
import { InfoPoster } from "@/components/info-poster";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const name = settings.legalName || settings.companyName;
  return {
    title: "Contact",
    description: `Contacter ${name} pour une question commerciale ou technique.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sujet?: string }> }) {
  const { sujet = "" } = await searchParams;
  const settings = await getSettings();
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Contact</h1>
        <p className="lede">Écrivez à l'équipe, ou joignez-la aux numéros indiqués sur l'affiche. Les deux numéros servent pour l'appel et pour WhatsApp.</p>
      </header>
      <div className="grid-2">
        <ContactForm subject={sujet} />
        <aside className="panel" style={{ padding: "1rem" }}>
          <h2>Coordonnées</h2>
          <ContactLines phone={settings.phone} whatsapp={settings.whatsapp} />
          <p>{settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : "E-mail non renseigné"}</p>
          <p>{settings.address || "Adresse non renseignée"}</p>
          <p>{[settings.city, settings.country].filter(Boolean).join(", ")}</p>
          <p>{settings.hours || "Horaires non renseignés"}</p>
          <p className="muted">Fuseau : {settings.timezone}</p>
          {settings.facebook ? <p><a href={settings.facebook}>Facebook</a></p> : null}
          {settings.linkedin ? <p><a href={settings.linkedin}>LinkedIn</a></p> : null}
          <InfoPoster />
        </aside>
      </div>
    </section>
  );
}
