"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { can } from "@/lib/permissions";

const LINKS: { href: string; label: string; permission?: string }[] = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/produits", label: "Produits", permission: "catalog.write" },
  { href: "/admin/categories", label: "Catégories", permission: "catalog.write" },
  { href: "/admin/marques", label: "Marques", permission: "catalog.write" },
  { href: "/admin/commandes", label: "Commandes", permission: "orders.read" },
  { href: "/admin/paiements", label: "Paiements", permission: "orders.read" },
  { href: "/admin/devis", label: "Devis", permission: "quotes.write" },
  { href: "/admin/services", label: "Services", permission: "services.write" },
  { href: "/admin/messages", label: "Messages", permission: "messages.read" },
  { href: "/admin/livraison", label: "Livraison", permission: "delivery.write" },
  { href: "/admin/contenu", label: "Contenus", permission: "content.write" },
  { href: "/admin/reglages", label: "Réglages", permission: "settings.write" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", permission: "users.write" },
  { href: "/admin/audit", label: "Journal", permission: "audit.read" },
];

export function AdminNav({ role }: { role: string }) {
  const path = usePathname();
  const links = LINKS.filter((link) => !link.permission || can(role, link.permission));
  return (
    <nav className="admin-nav" aria-label="Administration">
      {links.map((link) => {
        const current = link.href === "/admin" ? path === link.href : path.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

const FLASH_ERRORS: Record<string, string> = {
  acces: "Cette section n'est pas ouverte pour votre rôle.",
  champs: "Nom, référence ou slug manquant.",
  lien: "Marque ou catégorie introuvable.",
  nom: "Le nom est requis.",
  "photo-taille": "Photo trop lourde : 2 Mo maximum.",
  "photo-format": "Formats acceptés pour une photo : JPEG, PNG ou WebP.",
  "document-taille": "Document trop lourd : 2 Mo maximum.",
  "document-format": "Documents acceptés : PDF, JPEG, PNG ou WebP.",
};

export function Flash({ ok, erreur }: { ok?: string; erreur?: string }) {
  if (ok) return <p className="notice">Modification enregistrée.</p>;
  if (erreur) return <p className="error" role="alert">{FLASH_ERRORS[erreur] ?? `Action refusée (${erreur}).`}</p>;
  return null;
}
