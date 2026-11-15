import { Flash } from "@/components/admin/nav";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { saveBrand } from "@/server/admin-actions";

export default async function BrandsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await guard("catalog.write");
  const query = await searchParams;
  const brands = await db.brand.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1>Marques</h1>
      <Flash ok={query.ok} erreur={query.erreur} />
      <p className="muted">Ne créez une marque réelle que si vous la distribuez. Les marques de démonstration doivent rester signalées.</p>
      <form action={saveBrand} className="fields panel" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="field">Nom<input name="name" required /></label>
        <label className="field">Note<input name="note" /></label>
        <label className="check"><input type="checkbox" name="isDemo" value="oui" />Marque fictive de démonstration</label>
        <button className="btn-primary" type="submit">Ajouter</button>
      </form>
      {brands.map((brand) => (
        <form key={brand.id} action={saveBrand} className="fields panel" style={{ padding: "1rem", marginBottom: "0.6rem" }}>
          <input type="hidden" name="id" value={brand.id} />
          <label className="field">Nom<input name="name" defaultValue={brand.name} /></label>
          <label className="field">Slug<input name="slug" defaultValue={brand.slug} /></label>
          <label className="field">Note<input name="note" defaultValue={brand.note} /></label>
          <label className="check"><input type="checkbox" name="isDemo" value="oui" defaultChecked={brand.isDemo} />Démonstration</label>
          <button className="btn-ghost" type="submit">Enregistrer</button>
        </form>
      ))}
    </div>
  );
}
