import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  if (settings.demoMode) return [];
  const base = siteUrl();
  const staticPaths = ["", "/boutique", "/services", "/devis", "/a-propos", "/contact", "/faq", "/livraison", "/garantie", "/retours", "/confidentialite", "/conditions-generales", "/mentions-legales"];
  const products = await db.product.findMany({ where: { active: true, isDemo: false }, select: { slug: true, updatedAt: true } });
  return [
    ...staticPaths.map((path) => ({ url: `${base}${path || "/"}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...products.map((product) => ({ url: `${base}/produit/${product.slug}`, lastModified: product.updatedAt, priority: 0.6 })),
  ];
}
