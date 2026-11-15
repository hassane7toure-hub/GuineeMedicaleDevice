import Link from "next/link";
import { Flash } from "@/components/admin/nav";
import { db } from "@/lib/db";
import { cinetpayBlockers, cinetpayConfigured, paymentMode } from "@/lib/payments/provider";
import { getSettings } from "@/lib/settings";
import { deactivateDemoCatalog } from "@/server/admin-actions";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const query = await searchParams;
  const [settings, products, orders, quotes, services, pages, notifications] = await Promise.all([
    getSettings(),
    db.product.count({ where: { active: true, isDemo: false } }),
    db.order.count(),
    db.quoteRequest.count({ where: { status: "NEW" } }),
    db.serviceRequest.count({ where: { status: "NEW" } }),
    db.pageContent.count({ where: { needsReview: true } }),
    db.notification.count({ where: { status: { in: ["QUEUED", "SKIPPED", "FAILED"] } } }),
  ]);
  const checks = [
    [settings.phone, "Téléphone"],
    [settings.whatsapp, "WhatsApp"],
    [settings.email, "E-mail de contact"],
    [settings.address, "Adresse"],
    [settings.hours, "Horaires"],
    [settings.interventionAreas, "Zones d'intervention"],
    [products > 0 ? "ok" : "", "Au moins un produit réel, hors démonstration"],
    [!settings.demoMode ? "ok" : "", "Mode démonstration désactivé"],
    [paymentMode() === "live" && cinetpayConfigured() ? "ok" : "", "Paiement en ligne live et configuré en GNF"],
    [process.env.SMTP_HOST ? "ok" : "", "Messagerie SMTP"],
    [pages === 0 ? "ok" : "", "Pages juridiques relues"],
  ];
  return (
    <div>
      <h1>Tableau de bord</h1>
      <Flash ok={query.ok} erreur={query.erreur} />
      <div className="grid-4">
        <article className="card"><h2>{orders}</h2><p>Commandes</p></article>
        <article className="card"><h2>{quotes}</h2><p>Devis nouveaux</p></article>
        <article className="card"><h2>{services}</h2><p>Services nouveaux</p></article>
        <article className="card"><h2>{notifications}</h2><p>Notifications non envoyées</p></article>
      </div>
      <h2>Avant la mise en production</h2>
      <ul>
        {checks.map(([ok, label]) => (
          <li key={label}>{ok ? "Prêt" : "À fournir"} — {label}</li>
        ))}
      </ul>
      <p className="warn">Prestataire : {paymentMode() === "test" ? "mode test, aucun débit." : "mode live."} {cinetpayConfigured() ? "CinetPay est configuré en GNF." : cinetpayBlockers().join(" ")}</p>
      <form action={deactivateDemoCatalog}>
        <button className="btn-ghost" type="submit">Retirer les produits de démonstration du catalogue public</button>
      </form>
      <p><Link href="/admin/reglages">Compléter les coordonnées</Link></p>
    </div>
  );
}
