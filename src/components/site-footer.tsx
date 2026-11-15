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
          <h2>{settings.companyName}</h2>
          <p>{settings.tagline}</p>
          <p>{settings.legalName}</p>
          <p className="muted">{settings.legalNameNote}</p>
        </div>
        <div>
          <h2>Catalogue</h2>
          <p><Link href="/boutique">Boutique</Link></p>
          <p><Link href="/devis">Demande de devis</Link></p>
          <p><Link href="/services">Services techniques</Link></p>
          <p><Link href="/comparer">Comparer</Link></p>
        </div>
        <div>
          <h2>Informations</h2>
          <p><Link href="/livraison">Livraison</Link></p>
          <p><Link href="/garantie">Garantie</Link></p>
          <p><Link href="/retours">Retours</Link></p>
          <p><Link href="/faq">FAQ</Link></p>
          <p><Link href="/confidentialite">Confidentialité</Link></p>
          <p><Link href="/mentions-legales">Mentions légales</Link></p>
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
      <div className="wrap legal-note">Les contenus marqués comme démonstration, ainsi que les pages signalées « à valider », doivent être remplacés avant une mise en production.</div>
    </footer>
  );
}
