import { Flash } from "@/components/admin/nav";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { saveCategory } from "@/server/admin-actions";

export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await guard("catalog.write");
  const query = await searchParams;
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1>Catégories</h1>
      <Flash ok={query.ok} erreur={query.erreur} />
      <form action={saveCategory} className="fields cols-2 panel" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="field">Nom<input name="name" required /></label>
        <label className="field">Description<input name="description" /></label>
        <label className="field">Ordre<input name="sortOrder" defaultValue="0" /></label>
        <label className="check"><input type="checkbox" name="active" value="oui" defaultChecked />Active</label>
        <button className="btn-primary" type="submit">Ajouter</button>
      </form>
      {categories.map((category) => (
        <form key={category.id} action={saveCategory} className="fields cols-2 panel" style={{ padding: "1rem", marginBottom: "0.6rem" }}>
          <input type="hidden" name="id" value={category.id} />
          <label className="field">Nom<input name="name" defaultValue={category.name} /></label>
          <label className="field">Slug<input name="slug" defaultValue={category.slug} /></label>
          <label className="field">Description<input name="description" defaultValue={category.description} /></label>
          <label className="field">Ordre<input name="sortOrder" defaultValue={category.sortOrder} /></label>
          <label className="check"><input type="checkbox" name="active" value="oui" defaultChecked={category.active} />Active</label>
          <button className="btn-ghost" type="submit">Enregistrer</button>
        </form>
      ))}
    </div>
  );
}
