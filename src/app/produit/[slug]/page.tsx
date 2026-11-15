import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Availability } from "@/components/availability";
import { CompareButton } from "@/components/compare-button";
import { DeviceArt } from "@/components/device-art";
import { ServiceForm } from "@/components/forms";
import { JsonLd } from "@/components/json-ld";
import { PriceTag } from "@/components/price-tag";
import { ProductCard } from "@/components/product-card";
import { SubmitButton } from "@/components/submit-button";
import { fr } from "@/i18n/fr";
import { getProduct } from "@/lib/catalog";
import { addToCart } from "@/server/public-actions";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ erreur?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Produit" };
  return {
    title: product.name,
    description: product.summary || product.description.slice(0, 160),
    alternates: { canonical: `/produit/${product.slug}` },
  };
}

export default async function ProductPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { erreur } = await searchParams;
  const product = await getProduct(slug);
  if (!product) notFound();
  const errors: Record<string, string> = {
    indisponible: "Ce produit ne peut pas être ajouté au panier. Demandez un devis.",
    stock: "La quantité demandée dépasse le stock suivi.",
  };
  return (
    <article className="section wrap">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: product.sku,
          description: product.summary || product.description,
          brand: { "@type": "Brand", name: product.brandName },
          offers: product.priceGnf === null ? undefined : {
            "@type": "Offer",
            priceCurrency: "GNF",
            price: product.priceGnf,
            availability: product.availability === "IN_STOCK" ? "https://schema.org/InStock" : product.availability === "OUT_OF_STOCK" ? "https://schema.org/OutOfStock" : "https://schema.org/PreOrder",
          },
        }}
      />
      <p className="meta"><Link href="/boutique">Boutique</Link> / <Link href={`/boutique?categorie=${product.categorySlug}`}>{product.categoryName}</Link></p>
      <div className="grid-2" style={{ marginTop: "1rem" }}>
        <div className="gallery">
          {product.images.length ? product.images.map((image) => (
            <figure key={image.url} className="visual panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt} />
            </figure>
          )) : (
            <figure className="visual panel">
              <DeviceArt category={product.categorySlug} />
              <figcaption className="meta">Illustration de démonstration. La photographie du produit réel est à fournir.</figcaption>
            </figure>
          )}
        </div>
        <div className="panel" style={{ padding: "1.2rem" }}>
          {product.isDemo ? <p className="warn">Fiche de démonstration. Référence, prix, stock et caractéristiques sont fictifs.</p> : null}
          <h1>{product.name}</h1>
          <p className="meta">Réf. {product.sku} · {product.brandName}{product.brandDemo ? " (marque de démonstration)" : ""}</p>
          <p style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}><Availability value={product.availability} /></p>
          <p>{product.summary}</p>
          <PriceTag amount={product.priceGnf} demo={product.isDemo} />
          {product.leadTimeNote ? <p className="warn">Délai indicatif, non garanti : {product.leadTimeNote}</p> : <p className="muted">Aucun délai indicatif n'est renseigné. Un délai ne devient un engagement que s'il est écrit sur le devis ou la commande.</p>}
          {product.stockQty !== null ? <p className="muted">Quantité suivie{product.isDemo ? " de démonstration" : ""} : {product.stockQty}</p> : <p className="muted">Stock non suivi pour cette fiche.</p>}
          {erreur && errors[erreur] ? <p className="error" role="alert">{errors[erreur]}</p> : null}
          <div className="hero-actions">
            {product.canBuy ? (
              <form action={addToCart} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input type="hidden" name="slug" value={product.slug} />
                <label className="field">Quantité<input name="quantity" type="number" min={1} max={99} defaultValue={1} /></label>
                <SubmitButton>Ajouter au panier</SubmitButton>
              </form>
            ) : null}
            {product.allowQuote ? <Link className="btn-green" href={`/devis?produit=${product.slug}`}>Demander un devis</Link> : null}
            <CompareButton slug={product.slug} />
          </div>
          <p className="muted">Garantie : {product.warrantyNote || "information à confirmer sur le devis."}</p>
          <p><Link href="/livraison">Livraison et installation selon les zones configurées.</Link></p>
        </div>
      </div>
      <div className="grid-2" style={{ marginTop: "1rem" }}>
        <section className="panel" style={{ padding: "1rem" }}>
          <h2>Description</h2>
          <p>{product.description}</p>
          {product.usageNotes ? <><h2>Usages</h2><p>{product.usageNotes}</p></> : null}
          {product.installationNotes ? <><h2>Installation</h2><p>{product.installationNotes}</p></> : null}
          {product.accessoriesNote ? <><h2>Accessoires</h2><p>{product.accessoriesNote}</p></> : null}
          <p className="meta">Établissements : {product.audience.map((item) => fr.audience[item as keyof typeof fr.audience] || item).join(", ") || "Non précisé"}</p>
        </section>
        <section className="panel" style={{ padding: "1rem" }}>
          <h2>Caractéristiques</h2>
          {product.specs.length ? (
            <table className="specs">
              <tbody>
                {product.specs.map((spec) => (
                  <tr key={spec.label}><td>{spec.label}</td><td>{spec.value}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p>Caractéristiques à renseigner.</p>}
          {product.documents.length ? (
            <>
              <h2>Documents autorisés</h2>
              <ul>
                {product.documents.map((document) => (
                  <li key={document.id}><a href={`/documents/${document.id}`}>{document.title}</a></li>
                ))}
              </ul>
            </>
          ) : <p className="muted">Aucune fiche technique autorisée n'est jointe.</p>}
        </section>
      </div>
      {product.allowQuestion ? (
        <section className="section">
          <h2>Poser une question technique</h2>
          <ServiceForm defaults={{ serviceType: "CONSEIL", equipment: product.name, description: `Question à propos de ${product.name} (${product.sku}). ` }} />
        </section>
      ) : null}
      {product.related.length ? (
        <section>
          <h2>Dans la même catégorie</h2>
          <div className="product-grid">{product.related.map((item) => <ProductCard key={item.slug} product={item} />)}</div>
        </section>
      ) : null}
    </article>
  );
}
