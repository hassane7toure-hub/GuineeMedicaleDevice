import type { Metadata } from "next";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { fr } from "@/i18n/fr";
import { queryProducts, type CatalogQuery } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Boutique d'équipements médicaux",
  description: "Catalogue d'équipements médicaux, de réactifs de laboratoire, de consommables et de pièces. Prix en francs guinéens ou sur devis.",
  alternates: { canonical: "/boutique" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogQuery> }) {
  const params = await searchParams;
  const result = await queryProducts(params);
  return (
    <section className="section wrap">
      <header className="page-intro">
        <p className="eyebrow">Catalogue</p>
        <h1>Boutique</h1>
        <p className="lede">Recherche, filtres et pages courtes pour rester léger sur une connexion mobile. {result.total} produit{result.total > 1 ? "s" : ""}.</p>
      </header>
      <div className="filters">
        <form className="panel" style={{ padding: "1rem" }} action="/boutique">
          <div className="fields">
            <label className="field">Recherche<input name="q" defaultValue={params.q || ""} type="search" /></label>
            <label className="field">Catégorie
              <select name="categorie" defaultValue={params.categorie || ""}>
                <option value="">Toutes</option>
                {result.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
              </select>
            </label>
            <label className="field">Tri
              <select name="tri" defaultValue={params.tri || ""}>
                <option value="">Mis en avant</option>
                <option value="nom">Nom</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix décroissant</option>
              </select>
            </label>
          </div>
          <details style={{ margin: "0.8rem 0" }}>
            <summary>Plus de filtres</summary>
            <div className="fields" style={{ marginTop: "0.8rem" }}>
              <label className="field">Marque
                <select name="marque" defaultValue={params.marque || ""}>
                  <option value="">Toutes</option>
                  {result.brands.map((brand) => <option key={brand.id} value={brand.slug}>{brand.name}</option>)}
                </select>
              </label>
              <label className="field">Disponibilité
                <select name="dispo" defaultValue={params.dispo || ""}>
                  <option value="">Toutes</option>
                  {Object.entries(fr.availability).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="field">Établissement
                <select name="etablissement" defaultValue={params.etablissement || ""}>
                  <option value="">Tous</option>
                  {Object.entries(fr.audience).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="field">Usage
                <select name="usage" defaultValue={params.usage || ""}>
                  <option value="">Tous</option>
                  {Object.entries(fr.usage).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="field">Prix min. GNF<input name="min" inputMode="numeric" defaultValue={params.min || ""} /></label>
              <label className="field">Prix max. GNF<input name="max" inputMode="numeric" defaultValue={params.max || ""} /></label>
            </div>
          </details>
          <button className="btn-primary" type="submit">Appliquer</button>
        </form>
        <div>
          {result.products.length === 0 ? <p className="panel" style={{ padding: "1rem" }}>Aucun produit ne correspond. Élargissez les filtres ou demandez un devis.</p> : null}
          <div className="product-grid">
            {result.products.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Pagination page={result.page} pages={result.pages} params={params} />
          </div>
        </div>
      </div>
    </section>
  );
}
