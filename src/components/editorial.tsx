import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@/components/rich-text";
import { db } from "@/lib/db";

export async function loadPage(slug: string) {
  return db.pageContent.findUnique({ where: { slug_locale: { slug, locale: "fr" } } });
}

export async function Editorial({ slug }: { slug: string }) {
  const page = await loadPage(slug);
  if (!page) notFound();
  return (
    <article className="section wrap">
      <header className="page-intro">
        <h1>{page.title}</h1>
        {page.description ? <p className="lede">{page.description}</p> : null}
      </header>
      {page.needsReview ? (
        <p className="warn">Texte de travail à compléter et à faire valider. Il ne constitue pas un engagement commercial ou juridique.</p>
      ) : null}
      <div className="panel" style={{ padding: "1rem 1.2rem" }}>
        <RichText text={page.body} />
      </div>
    </article>
  );
}

export async function editorialMetadata(slug: string, fallback: string): Promise<Metadata> {
  const page = await loadPage(slug);
  return {
    title: page?.title || fallback,
    description: page?.description || fallback,
    alternates: { canonical: `/${slug}` },
  };
}
