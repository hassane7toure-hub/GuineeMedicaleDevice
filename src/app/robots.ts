import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  if (settings.demoMode) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/panier", "/commande", "/paiement", "/api"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
