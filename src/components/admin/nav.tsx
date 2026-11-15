"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/admin", "Tableau de bord"],
  ["/admin/produits", "Produits"],
  ["/admin/categories", "Catégories"],
  ["/admin/marques", "Marques"],
  ["/admin/commandes", "Commandes"],
  ["/admin/paiements", "Paiements"],
  ["/admin/devis", "Devis"],
  ["/admin/services", "Services"],
  ["/admin/messages", "Messages"],
  ["/admin/livraison", "Livraison"],
  ["/admin/contenu", "Contenus"],
  ["/admin/reglages", "Réglages"],
  ["/admin/utilisateurs", "Utilisateurs"],
  ["/admin/audit", "Journal"],
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admin-nav" aria-label="Administration">
      {LINKS.map(([href, label]) => {
        const current = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={current ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Flash({ ok, erreur }: { ok?: string; erreur?: string }) {
  if (ok) return <p className="notice">Modification enregistrée.</p>;
  if (erreur) return <p className="error" role="alert">Action refusée ({erreur}).</p>;
  return null;
}
