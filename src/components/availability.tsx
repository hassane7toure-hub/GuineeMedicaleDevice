import { fr } from "@/i18n/fr";

const CLASS: Record<string, string> = {
  IN_STOCK: "badge badge-in",
  ON_ORDER: "badge badge-order",
  OUT_OF_STOCK: "badge badge-out",
  QUOTE_ONLY: "badge badge-quote",
};

export function Availability({ value }: { value: string }) {
  const label = fr.availability[value as keyof typeof fr.availability] ?? value;
  return <span className={CLASS[value] ?? "badge"}>{label}</span>;
}
