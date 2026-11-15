import type { Metadata } from "next";
import { ServiceForm } from "@/components/forms";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Installation, maintenance et conseil",
  description: "Demandes d'installation, de maintenance préventive ou corrective et de conseil technique en équipements médicaux.",
  alternates: { canonical: "/services" },
};

const TITLES = ["Vente et fourniture", "Installation et mise en service", "Maintenance", "Conseil technique"];

export default async function ServicesPage() {
  const settings = await getSettings();
  return (
    <section className="section wrap">
      <header className="page-intro">
        <p className="eyebrow">Services</p>
        <h1>Installation, maintenance et conseil</h1>
        <p className="lede">{settings.intro}</p>
      </header>
      <div className="grid-2">
        {TITLES.map((title, index) => (
          <article key={title} className="card">
            <h2>{title}</h2>
            <p>{settings.serviceBlurbs[index]}</p>
          </article>
        ))}
      </div>
      <div id="demande" className="section">
        <h2>Demande de service</h2>
        <p className="muted">Indiquez le type d'équipement, le lieu, l'urgence ressentie et vos coordonnées. La demande reçoit une référence. Elle ne programme pas encore une intervention.</p>
        <ServiceForm />
      </div>
    </section>
  );
}
