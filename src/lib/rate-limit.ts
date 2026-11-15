import { headers } from "next/headers";
import { db } from "./db";

export async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "local";
}

export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const row = await db.rateBucket.findUnique({ where: { key } });
  if (!row || row.resetAt < now) {
    await db.rateBucket.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
      update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
    });
    return true;
  }
  if (row.count >= limit) return false;
  await db.rateBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
