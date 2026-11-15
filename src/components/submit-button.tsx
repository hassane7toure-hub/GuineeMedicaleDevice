"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingLabel = "Envoi…" }: { children: React.ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" type="submit" disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
