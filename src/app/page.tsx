import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { JsonLd } from "@/components/json-ld";
import { featuredProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { phoneHref } from "@/lib/format";
import { getSettings } from "@/lib/settings";

const SERVICE_TITLES = ["Vente et fourniture", "Installation et mise en service", "Maintenance", "Conseil technique"];

export default async function HomePage() {
  const [settings, categories, products] = await Promise.all([
    getSettings(),
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    featuredProducts(),
  ]);
  const phone = phoneHref(settings.phone);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: settings.legalName || settings.companyName,
          description: settings.intro,
          areaServed: "GN",
          currenciesAccepted: "GNF",
          email: settings.email || undefined,
          telephone: settings.phone || undefined,
          address: settings.address
            ? { "@type": "PostalAddress", streetAddress: settings.address, addressLocality: settings.city, addressCountry: "GN" }
            : undefined,
        }}
      />
      <section className="section wrap">
        <div className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Équipements et réactifs · Guinée</p>
            <h1>{settings.heroTitle}</h1>
            <p>{settings.heroSubtitle}</p>
            <div className="hero-actions">
              <Link className="btn btn-light" href="/boutique">Voir la boutique</Link>
              <Link className="btn btn-line" href="/devis">Demander un devis</Link>
            </div>
          </div>
          <div className="hero-side">
            <svg className="ecg" viewBox="0 0 360 80" aria-hidden="true">
              <polyline points="0,40 40,40 70,40 88,18 104,64 122,28 140,40 360,40" fill="none" stroke="#2fa86c" strokeWidth="3" />
              <circle cx="88" cy="18" r="4" fill="#e03e3e" />
            </svg>
            <p><strong>Quatre expertises, un interlocuteur technique.</strong></p>
            <p className="muted">Vente, installation, maintenance et conseil. Les délais et garanties sont ceux confirmés sur le devis ou la commande, pas une promesse générale.</p>
          </div>
        </div>
      </section>
      <section className="section wrap">
        <div className="grid-4">
          {SERVICE_TITLES.map((title, index) => (
            <article key={title} className="card">
              <p className="eyebrow">0{index + 1}</p>
              <h2>{title}</h2>
              <p>{settings.serviceBlurbs[index]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section wrap">
        <div className="kicker">
          <h2>Catégories</h2>
          <Link href="/boutique">Tout le catalogue</Link>
        </div>
        <div className="grid-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/boutique?categorie=${category.slug}`} className="card">
              <h3>{category.name}</h3>
              <p className="muted">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="section wrap">
        <div className="kicker">
          <h2>Sélection</h2>
          <Link href="/boutique">Comparer et filtrer</Link>
        </div>
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>
      <section className="section wrap">
        <h2>Pour qui</h2>
        <div className="grid-4">
          {["Hôpitaux", "Cliniques et cabinets", "Laboratoires et pharmacies", "ONG et particuliers"].map((item) => (
            <article key={item} className="card"><h3>{item}</h3></article>
          ))}
        </div>
      </section>
      <section className="section wrap grid-2">
        <article className="card">
          <h2>Zones d'intervention</h2>
          <p>{settings.interventionAreas || "Les zones desservies ne sont pas encore renseignées. Elles se configurent dans l'administration, sans inventer de couverture."}</p>
          <p className="muted">{settings.hours ? `Horaires : ${settings.hours}` : "Horaires à configurer."}</p>
        </article>
        <article className="card">
          <h2>Parler à l'équipe commerciale</h2>
          <p>Pour un projet, un devis groupé ou une question technique, écrivez-nous. La réponse part de la demande enregistrée, pas d'un délai affiché par défaut.</p>
          <div className="hero-actions">
            <Link className="btn-primary" href="/contact">Écrire</Link>
            {phone ? <a className="btn-ghost" href={phone}>Appeler</a> : null}
            <Link className="btn-ghost" href="/devis">Demander un devis</Link>
          </div>
        </article>
      </section>
    </>
  );
}
