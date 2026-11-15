"use client";

export function CompareButton({ slug }: { slug: string }) {
  return (
    <button
      className="btn-ghost"
      type="button"
      onClick={() => {
        const key = "gmd_compare";
        const current = JSON.parse(localStorage.getItem(key) || "[]") as string[];
        const next = Array.from(new Set([...current, slug])).slice(-3);
        localStorage.setItem(key, JSON.stringify(next));
        window.location.href = `/comparer?ids=${next.join(",")}`;
      }}
    >
      Comparer
    </button>
  );
}
