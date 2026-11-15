import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm, RegisterForm } from "@/components/forms";
import { currentUser } from "@/lib/auth";
import { safeNext } from "@/lib/validators";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; inscription?: string }> }) {
  const params = await searchParams;
  const user = await currentUser();
  if (user) redirect(safeNext(params.next));
  const next = safeNext(params.next);
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>{params.inscription ? "Créer un compte" : "Connexion"}</h1>
        <p className="lede">Le compte client est facultatif pour commander. L'espace équipe utilise les mêmes identifiants, avec un rôle attribué par un administrateur.</p>
      </header>
      <div className="grid-2">
        {params.inscription ? <RegisterForm /> : <LoginForm next={next} />}
        <aside className="panel" style={{ padding: "1rem" }}>
          {params.inscription ? <Link href={`/compte/connexion?next=${encodeURIComponent(next)}`}>J'ai déjà un compte</Link> : <Link href={`/compte/connexion?inscription=1&next=${encodeURIComponent(next)}`}>Créer un compte</Link>}
        </aside>
      </div>
    </section>
  );
}
