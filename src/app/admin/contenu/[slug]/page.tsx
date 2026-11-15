import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/nav";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { savePage } from "@/server/admin-actions";

export default async function EditContentPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ok?: string }> }) {
  await guard("content.write");
  const { slug } = await params;
  const query = await searchParams;
  const page = await db.pageContent.findUnique({ where: { slug_locale: { slug, locale: "fr" } } });
  if (!page) notFound();
  return (
    <div>
      <h1>{page.title}</h1>
      <Flash ok={query.ok} />
      <form action={savePage} className="fields">
        <input type="hidden" name="slug" value={page.slug} />
        <label className="field">Titre<input name="title" defaultValue={page.title} /></label>
        <label className="field">Description SEO<input name="description" defaultValue={page.description} /></label>
        <label className="field">Texte<textarea name="body" defaultValue={page.body} style={{ minHeight: "18rem" }} /></label>
        <p className="muted">Utilisez une ligne vide entre les paragraphes, « ## » pour un titre et « - » pour une liste. Le HTML est ignoré.</p>
        <label className="check"><input type="checkbox" name="needsReview" value="oui" defaultChecked={page.needsReview} />Ce texte reste à faire valider</label>
        <button className="btn-primary" type="submit">Enregistrer</button>
      </form>
    </div>
  );
}
