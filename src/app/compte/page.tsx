import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/forms";
import { currentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { logout } from "@/server/auth-actions";

export const metadata: Metadata = { title: "Compte", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/compte/connexion");
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Bonjour {user.name}</h1>
        <p className="lede">{user.email}</p>
      </header>
      <div className="hero-actions">
        <Link className="btn-ghost" href="/compte/commandes">Mes commandes</Link>
        {isStaff(user.role) ? <Link className="btn-primary" href="/admin">Espace équipe</Link> : null}
        <form action={logout}><button className="btn-ghost" type="submit">Se déconnecter</button></form>
      </div>
      <div className="section" style={{ maxWidth: "36rem" }}>
        <h2>Profil</h2>
        <ProfileForm user={user} />
      </div>
    </section>
  );
}
