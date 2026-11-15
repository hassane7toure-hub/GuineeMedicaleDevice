import Link from "next/link";

export function Pagination({
  page,
  pages,
  params,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const text = query.toString();
    return text ? `/boutique?${text}` : "/boutique";
  };
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-3" style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
      {page > 1 ? <Link className="btn-ghost" href={href(page - 1)}>Précédent</Link> : null}
      <span>Page {page} sur {pages}</span>
      {page < pages ? <Link className="btn-ghost" href={href(page + 1)}>Suivant</Link> : null}
    </nav>
  );
}
