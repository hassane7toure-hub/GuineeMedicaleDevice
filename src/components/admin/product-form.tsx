import { fr } from "@/i18n/fr";
import { specsToText } from "@/lib/text";
import { archiveProduct, detachImage, saveProduct } from "@/server/admin-actions";

type ProductFormData = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  summary: string;
  description: string;
  brandId: string;
  categoryId: string;
  priceGnf: string;
  availability: string;
  stockQty: string;
  leadTimeNote: string;
  usageNotes: string;
  installationNotes: string;
  accessoriesNote: string;
  warrantyNote: string;
  audience: string;
  usage: string;
  featured: boolean;
  active: boolean;
  isDemo: boolean;
  allowCart: boolean;
  allowQuote: boolean;
  allowQuestion: boolean;
  specs: string;
  images: { id: string; url: string; alt: string }[];
};

export function ProductForm({
  product,
  brands,
  categories,
}: {
  product?: ProductFormData;
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const value = product ?? {
    id: "",
    slug: "",
    sku: "",
    name: "",
    summary: "",
    description: "",
    brandId: brands[0]?.id || "",
    categoryId: categories[0]?.id || "",
    priceGnf: "",
    availability: "ON_ORDER",
    stockQty: "",
    leadTimeNote: "",
    usageNotes: "",
    installationNotes: "",
    accessoriesNote: "",
    warrantyNote: "",
    audience: "",
    usage: "",
    featured: false,
    active: true,
    isDemo: false,
    allowCart: true,
    allowQuote: true,
    allowQuestion: true,
    specs: "",
    images: [],
  };
  const audience = value.audience.split(",");
  const usage = value.usage.split(",");
  return (
    <>
    <form action={saveProduct} className="fields">
      <input type="hidden" name="id" value={value.id} />
      <div className="fields cols-2">
        <label className="field">Nom<input name="name" required defaultValue={value.name} /></label>
        <label className="field">Référence SKU<input name="sku" required defaultValue={value.sku} /></label>
        <label className="field">Slug<input name="slug" defaultValue={value.slug} placeholder="Laissez vide pour le générer" /></label>
        <label className="field">Prix GNF, vide si devis<input name="priceGnf" inputMode="numeric" defaultValue={value.priceGnf} /></label>
        <label className="field">Marque
          <select name="brandId" defaultValue={value.brandId}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>
        </label>
        <label className="field">Catégorie
          <select name="categoryId" defaultValue={value.categoryId}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        </label>
        <label className="field">Disponibilité
          <select name="availability" defaultValue={value.availability}>
            {Object.entries(fr.availability).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="field">Stock suivi, vide si non suivi<input name="stockQty" inputMode="numeric" defaultValue={value.stockQty} /></label>
      </div>
      <label className="field">Résumé<input name="summary" defaultValue={value.summary} /></label>
      <label className="field">Description<textarea name="description" defaultValue={value.description} /></label>
      <label className="field">Caractéristiques, une par ligne « Nom : valeur »<textarea name="specs" defaultValue={value.specs} /></label>
      <label className="field">Délai indicatif, non garanti<input name="leadTimeNote" defaultValue={value.leadTimeNote} /></label>
      <label className="field">Usages<textarea name="usageNotes" defaultValue={value.usageNotes} /></label>
      <label className="field">Installation<textarea name="installationNotes" defaultValue={value.installationNotes} /></label>
      <label className="field">Accessoires<textarea name="accessoriesNote" defaultValue={value.accessoriesNote} /></label>
      <label className="field">Garantie<textarea name="warrantyNote" defaultValue={value.warrantyNote} /></label>
      <fieldset>
        <legend>Établissements</legend>
        {Object.entries(fr.audience).map(([key, label]) => (
          <label key={key} className="check"><input type="checkbox" name="audience" value={key} defaultChecked={audience.includes(key)} />{label}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Usages</legend>
        {Object.entries(fr.usage).map(([key, label]) => (
          <label key={key} className="check"><input type="checkbox" name="usage" value={key} defaultChecked={usage.includes(key)} />{label}</label>
        ))}
      </fieldset>
      <label className="check"><input type="checkbox" name="featured" value="oui" defaultChecked={value.featured} />Mettre en avant</label>
      <label className="check"><input type="checkbox" name="active" value="oui" defaultChecked={value.active} />Visible dans la boutique</label>
      <label className="check"><input type="checkbox" name="isDemo" value="oui" defaultChecked={value.isDemo} />Contenu de démonstration</label>
      <label className="check"><input type="checkbox" name="allowCart" value="oui" defaultChecked={value.allowCart} />Autoriser le panier si le prix et le stock le permettent</label>
      <label className="check"><input type="checkbox" name="allowQuote" value="oui" defaultChecked={value.allowQuote} />Autoriser le devis</label>
      <label className="check"><input type="checkbox" name="allowQuestion" value="oui" defaultChecked={value.allowQuestion} />Autoriser la question technique</label>
      <label className="field">Photo JPEG, PNG ou WebP, 2 Mo<input name="image" type="file" accept="image/png,image/jpeg,image/webp" /></label>
      <label className="field">Texte alternatif de la photo, facultatif<input name="imageAlt" placeholder="Si vide, le nom du produit est utilisé" /></label>
      <label className="field">Document PDF ou image<input name="document" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" /></label>
      <label className="field">Titre du document<input name="documentTitle" /></label>
      <label className="check"><input type="checkbox" name="documentAuthorized" value="oui" />J'ai le droit de publier ce document</label>
      <button className="btn-primary" type="submit">Enregistrer</button>
      {value.images.length ? (
        <div className="grid-3">
          {value.images.map((image) => (
            <figure key={image.id} className="card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt} />
              <figcaption>{image.alt}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      {value.id ? (
        <button className="btn-danger" formAction={archiveProduct} type="submit">Retirer de la boutique</button>
      ) : null}
    </form>
    {value.images.map((image) => (
      <form key={image.id} action={detachImage}>
        <input type="hidden" name="imageId" value={image.id} />
        <button className="btn-ghost" type="submit">
          Retirer la liaison de l'image « {image.alt} » (le fichier n'est pas supprimé)
        </button>
      </form>
    ))}
    </>
  );
}

export function specsValue(raw: string) {
  return specsToText(raw);
}
