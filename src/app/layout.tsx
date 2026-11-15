import type { Metadata } from "next";
import { Outfit, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${settings.companyName} · Équipements médicaux en Guinée`, template: `%s · ${settings.companyName}` },
    description: settings.intro.slice(0, 180),
    applicationName: settings.companyName,
    robots: settings.demoMode ? { index: false, follow: false } : { index: true, follow: true },
    icons: { icon: "/brand/logo.png" },
    openGraph: { locale: "fr_GN", siteName: settings.companyName, type: "website" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${outfit.variable} ${source.variable}`} data-scroll-behavior="smooth">
      <body>
        <a className="skip" href="#contenu">Aller au contenu</a>
        <SiteHeader />
        <main id="contenu">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
