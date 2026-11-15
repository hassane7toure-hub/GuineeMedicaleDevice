"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn-ghost no-print" onClick={() => window.print()}>
      Imprimer ou enregistrer en PDF
    </button>
  );
}
