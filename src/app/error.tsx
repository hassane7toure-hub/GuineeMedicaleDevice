"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section wrap">
      <header className="page-intro">
        <h1>Une erreur est survenue</h1>
        <p className="lede">Rechargez la page. Si cela continue, utilisez le formulaire de contact.</p>
      </header>
      <button className="btn-primary" type="button" onClick={() => reset()}>Réessayer</button>
    </section>
  );
}
