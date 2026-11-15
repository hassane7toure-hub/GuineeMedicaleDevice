import { indicativeAmount } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export async function PriceTag({ amount, demo = false }: { amount: number | null; demo?: boolean }) {
  const settings = await getSettings();
  if (amount === null) return <strong className="price">Sur devis</strong>;
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  const eur = indicativeAmount(amount, settings.rateEurPerGnf, "EUR");
  const usd = indicativeAmount(amount, settings.rateUsdPerGnf, "USD");
  return (
    <span>
      <strong className="price">{formatted} GNF</strong>
      {demo ? <span className="indicative">Prix de démonstration, non contractuel.</span> : null}
      {eur || usd ? (
        <span className="indicative">
          Indicatif, non contractuel : {[eur, usd].filter(Boolean).join(" · ")}. Taux saisi par l'administrateur.
        </span>
      ) : null}
    </span>
  );
}
