import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Page introuvable</h1>
        <p className="lede">Ce lien ne correspond à aucune page publiée.</p>
      </header>
      <Link className="btn-primary" href="/">Retour à l'accueil</Link>
    </section>
  );
}
