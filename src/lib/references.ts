import { db } from "./db";

export async function nextReference(prefix: "CMD" | "DEV" | "SRV" | "CTC" | "CNF" | "PRO") {
  const year = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Conakry",
    year: "numeric",
  }).format(new Date());
  const key = `${prefix}-${year}`;
  const row = await db.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `GMD-${prefix}-${year}-${String(row.value).padStart(4, "0")}`;
}
