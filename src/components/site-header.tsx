import Image from "next/image";
import Link from "next/link";
import { cartCount } from "@/lib/cart";
import { fr } from "@/i18n/fr";
import { getSettings } from "@/lib/settings";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const [settings, count] = await Promise.all([getSettings(), cartCount()]);
  return (
    <header className="site-header">
      {settings.demoMode ? (
        <div className="demo-banner">
          <p>Site de démonstration. Les prix, stocks, délais et conditions affichés ne constituent pas une offre contractuelle.</p>
        </div>
      ) : null}
      <div className="topbar">
        <div className="topbar-inner">
          <span>{settings.country} · Franc guinéen (GNF) · {settings.timezone}</span>
          <Link href="/compte">{fr.nav.account}</Link>
        </div>
      </div>
      <div className="header-inner">
        <Link href="/" className="brand">
          <Image src="/brand/wordmark.png" alt="Guinea Medical Device" width={1740} height={320} priority />
        </Link>
        <nav className="desktop-nav" aria-label="Navigation principale">
          <Link href="/boutique">{fr.nav.shop}</Link>
          <Link href="/services">{fr.nav.services}</Link>
          <Link href="/devis">{fr.nav.quote}</Link>
          <Link href="/a-propos">{fr.nav.about}</Link>
          <Link href="/contact">{fr.nav.contact}</Link>
          <form action="/boutique" role="search">
            <input name="q" type="search" aria-label="Rechercher un équipement" placeholder="Rechercher" />
          </form>
        </nav>
        <div className="header-actions">
          <Link className="btn-green" href="/devis">{fr.nav.quote}</Link>
          <Link className="btn-ghost" href="/panier">
            {fr.nav.cart}
            {count ? ` (${count})` : ""}
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
