const TIME_ZONE = "Africa/Conakry";

export function gnfNumber(value: bigint | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const amount = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isSafeInteger(amount)) return null;
  return amount;
}

export function formatGnf(value: bigint | number | null | undefined) {
  const amount = gnfNumber(value);
  if (amount === null) return null;
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  return `${formatted} GNF`;
}

export function indicativeAmount(priceGnf: number, rateText: string, currency: "EUR" | "USD") {
  const rate = Number(rateText);
  if (!rateText.trim() || !Number.isFinite(rate) || rate <= 0) return null;
  const value = priceGnf * rate;
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function whatsappHref(value: string) {
  const digits = digitsOnly(value);
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

export function phoneHref(value: string) {
  const compact = value.replace(/[^\d+]/g, "");
  if (digitsOnly(compact).length < 8) return null;
  return `tel:${compact}`;
}
