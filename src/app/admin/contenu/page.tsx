import Link from "next/link";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";

export default async function ContentAdmin() {
  await guard("content.write");
  const pages = await db.pageContent.findMany({ where: { locale: "fr" }, orderBy: { title: "asc" } });
  return (
    <div>
      <h1>Contenus</h1>
      <ul>
        {pages.map((page) => (
          <li key={page.id}><Link href={`/admin/contenu/${page.slug}`}>{page.title}</Link> {page.needsReview ? "· à valider" : "· relu"}</li>
        ))}
      </ul>
    </div>
  );
}
