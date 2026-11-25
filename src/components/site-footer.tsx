import Link from "next/link";
import { ContactLines } from "@/components/contact-lines";
import { fr } from "@/i18n/fr";
import { getSettings } from "@/lib/settings";

export async function SiteFooter() {
  const settings = await getSettings();
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <h2>{settings.legalName || settings.companyName}</h2>
          <p>{settings.tagline}</p>
          {settings.legalName && settings.legalName !== settings.companyName ? <p>{settings.companyName}</p> : null}
          {settings.legalNameNote ? <p className="muted">{settings.legalNameNote}</p> : null}
        </div>
        <div>
          <h2>Catalogue</h2>
          <p><Link href="/boutique">Boutique</Link></p>
          <p><Link href="/devis">Demande de devis</Link></p>
          <p><Link href="/services">Services techniques</Link></p>
          <p><Link href="/comparer">Comparer</Link></p>
        </div>
        <div>
          <h2>Contact</h2>
          <ContactLines phone={settings.phone} whatsapp={settings.whatsapp} />
          <p>{settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : "E-mail à configurer"}</p>
          <p>{settings.address || "Adresse à configurer"}</p>
          <p>{settings.city}</p>
          <p>{settings.hours || "Horaires à configurer"}</p>
          <p><Link href="/admin">{fr.nav.team}</Link></p>
        </div>
      </div>
      <nav className="wrap legal-links" aria-label="Pages d'information">
        <Link href="/conditions-generales">Conditions générales de vente</Link>
        <Link href="/confidentialite">Confidentialité</Link>
        <Link href="/garantie">Garantie</Link>
        <Link href="/livraison">Livraison et installation</Link>
        <Link href="/mentions-legales">Mentions légales</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/retours">Retours</Link>
      </nav>
      <div className="wrap legal-note">Les contenus marqués comme démonstration, ainsi que les pages signalées « à valider », doivent être remplacés avant une mise en production.</div>
    </footer>
  );
}
