"use client";

import { useActionState, useEffect, useState } from "react";
import { fr } from "@/i18n/fr";
import { createContact, createPrivacy, createQuote, createService, lookupOrder, placeOrder, type ActionState } from "@/server/public-actions";
import { login, register, updateProfile } from "@/server/auth-actions";
import { SubmitButton } from "./submit-button";

const empty: ActionState = { ok: false };

function Guards() {
  const [startedAt, setStartedAt] = useState("");
  useEffect(() => {
    setStartedAt(String(Date.now()));
  }, []);
  return (
    <>
      <input type="hidden" name="startedAt" value={startedAt} />
      <p className="hp">
        <label>
          Ne pas remplir
          <input name="gmd_hp" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
    </>
  );
}

function Errors({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <p className={state.ok ? "notice" : "error"} role={state.ok ? "status" : "alert"}>{state.message}</p>;
}

function Consent() {
  return (
    <label className="check">
      <input type="checkbox" name="consent" value="oui" required />
      <span>J'accepte que ces informations soient utilisées pour traiter ma demande, conformément à la page Confidentialité.</span>
    </label>
  );
}

export function QuoteForm({ products, selected = "" }: { products: { slug: string; name: string; sku: string }[]; selected?: string }) {
  const [state, action] = useActionState(createQuote, empty);
  return (
    <form action={action} className="fields">
      <Guards />
      <Errors state={state} />
      <div className="fields cols-2">
        <label className="field">Nom<input name="name" required autoComplete="name" /></label>
        <label className="field">Organisation<input name="organization" autoComplete="organization" /></label>
        <label className="field">Fonction<input name="roleTitle" /></label>
        <label className="field">Téléphone<input name="phone" required autoComplete="tel" placeholder="+224 6XX XX XX XX" />{state.fieldErrors?.phone && <span className="error">{state.fieldErrors.phone}</span>}</label>
        <label className="field">E-mail<input name="email" type="email" required autoComplete="email" />{state.fieldErrors?.email && <span className="error">{state.fieldErrors.email}</span>}</label>
        <label className="field">Ville<input name="city" required placeholder="Ex. Conakry" /></label>
      </div>
      <fieldset>
        <legend>Produits concernés, si déjà identifiés</legend>
        <div className="fields">
          {products.map((product) => (
            <label key={product.slug} className="check">
              <input type="checkbox" name="products" value={product.slug} defaultChecked={selected === product.slug} />
              <span>{product.name} · {product.sku}</span>
              <input name={`qty_${product.slug}`} type="number" min={1} max={99} defaultValue={1} aria-label={`Quantité pour ${product.name}`} style={{ width: "4.5rem" }} />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">Besoin<textarea name="need" required placeholder="Usage, quantité, lieu, contraintes d'installation…" /></label>
      <label className="field">Pièces jointes (PDF ou image, 3 fichiers, 2 Mo)<input name="attachments" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" multiple /></label>
      <Consent />
      <SubmitButton>Envoyer la demande</SubmitButton>
    </form>
  );
}

export function ContactForm({ subject = "" }: { subject?: string }) {
  const [state, action] = useActionState(createContact, empty);
  return (
    <form action={action} className="fields">
      <Guards />
      <Errors state={state} />
      <label className="field">Nom<input name="name" required autoComplete="name" /></label>
      <label className="field">E-mail<input name="email" type="email" required autoComplete="email" /></label>
      <label className="field">Téléphone<input name="phone" autoComplete="tel" placeholder="+224" /></label>
      <label className="field">Objet<input name="subject" required defaultValue={subject} /></label>
      <label className="field">Message<textarea name="message" required /></label>
      <Consent />
      <SubmitButton>Envoyer</SubmitButton>
    </form>
  );
}

export function ServiceForm({
  defaults,
}: {
  defaults?: { serviceType?: string; equipment?: string; description?: string };
}) {
  const [state, action] = useActionState(createService, empty);
  return (
    <form action={action} className="fields">
      <Guards />
      <Errors state={state} />
      <label className="field">
        Type de demande
        <select name="serviceType" defaultValue={defaults?.serviceType || "CONSEIL"}>
          {Object.entries(fr.serviceType).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="field">Équipement concerné<input name="equipment" defaultValue={defaults?.equipment || ""} /></label>
      <div className="fields cols-2">
        <label className="field">Localisation<input name="location" required placeholder="Ville, quartier ou établissement" /></label>
        <label className="field">
          Urgence
          <select name="urgency" defaultValue="NORMAL">
            {Object.entries(fr.urgency).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">L'indication « urgente » décrit votre contrainte. Elle ne constitue pas un délai garanti.</p>
      <label className="field">Description<textarea name="description" required defaultValue={defaults?.description || ""} /></label>
      <div className="fields cols-2">
        <label className="field">Nom<input name="name" required /></label>
        <label className="field">Organisation<input name="organization" /></label>
        <label className="field">Téléphone<input name="phone" required placeholder="+224" /></label>
        <label className="field">E-mail<input name="email" type="email" required /></label>
      </div>
      <Consent />
      <SubmitButton>Envoyer la demande</SubmitButton>
    </form>
  );
}

export function PrivacyForm() {
  const [state, action] = useActionState(createPrivacy, empty);
  return (
    <form action={action} className="fields">
      <Guards />
      <Errors state={state} />
      <label className="field">Nom<input name="name" required /></label>
      <label className="field">E-mail<input name="email" type="email" required /></label>
      <label className="field">Téléphone<input name="phone" /></label>
      <label className="field">
        Type de demande
        <select name="type" defaultValue="ACCESS">
          <option value="ACCESS">Accès à mes données</option>
          <option value="CORRECTION">Correction</option>
          <option value="DELETION">Suppression</option>
        </select>
      </label>
      <label className="field">Précisions<textarea name="message" required /></label>
      <Consent />
      <SubmitButton>Envoyer la demande</SubmitButton>
    </form>
  );
}

export function LoginForm({ next = "/compte" }: { next?: string }) {
  const [state, action] = useActionState(login, empty);
  return (
    <form action={action} className="fields">
      <Errors state={state} />
      <input type="hidden" name="next" value={next} />
      <label className="field">E-mail<input name="email" type="email" required autoComplete="username" /></label>
      <label className="field">Mot de passe<input name="password" type="password" required autoComplete="current-password" /></label>
      <SubmitButton>Se connecter</SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(register, empty);
  return (
    <form action={action} className="fields">
      <Errors state={state} />
      <label className="field">Nom<input name="name" required /></label>
      <label className="field">E-mail<input name="email" type="email" required /></label>
      <label className="field">Téléphone<input name="phone" /></label>
      <label className="field">Organisation<input name="organization" /></label>
      <label className="field">Ville<input name="city" /></label>
      <label className="field">Mot de passe<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label>
      <p className="muted">12 caractères minimum, avec une lettre et un chiffre.</p>
      <SubmitButton>Créer le compte</SubmitButton>
    </form>
  );
}

export function ProfileForm({ user }: { user: { name: string; phone: string; organization: string; city: string; email: string } }) {
  const [state, action] = useActionState(updateProfile, empty);
  return (
    <form action={action} className="fields">
      <Errors state={state} />
      <p className="muted">{user.email}</p>
      <label className="field">Nom<input name="name" defaultValue={user.name} required /></label>
      <label className="field">Téléphone<input name="phone" defaultValue={user.phone} /></label>
      <label className="field">Organisation<input name="organization" defaultValue={user.organization} /></label>
      <label className="field">Ville<input name="city" defaultValue={user.city} /></label>
      <label className="field">Mot de passe actuel<input name="currentPassword" type="password" autoComplete="current-password" /></label>
      <label className="field">Nouveau mot de passe<input name="newPassword" type="password" autoComplete="new-password" /></label>
      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}

export function LookupForm() {
  const [state, action] = useActionState(lookupOrder, empty);
  return (
    <form action={action} className="fields">
      <Guards />
      <Errors state={state} />
      <label className="field">Référence de commande<input name="reference" required placeholder="GMD-CMD-…" /></label>
      <label className="field">E-mail utilisé pour la commande<input name="email" type="email" required /></label>
      <SubmitButton>Consulter</SubmitButton>
    </form>
  );
}

export function CheckoutForm({
  idempotencyKey,
  options,
  methods,
  account,
}: {
  idempotencyKey: string;
  options: { id: string; name: string; description: string; feeLabel: string; delayNote: string; isDemo: boolean }[];
  methods: { id: string; label: string; detail: string }[];
  account: { name: string; email: string; phone: string; organization: string; city: string } | null;
}) {
  const [state, action] = useActionState(placeOrder, empty);
  return (
    <form action={action} className="fields">
      <Guards />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <Errors state={state} />
      <div className="fields cols-2">
        <label className="field">Nom<input name="customerName" required defaultValue={account?.name || ""} /></label>
        <label className="field">Organisation<input name="organization" defaultValue={account?.organization || ""} /></label>
        <label className="field">Téléphone<input name="phone" required defaultValue={account?.phone || ""} placeholder="+224" />{state.fieldErrors?.phone && <span className="error">{state.fieldErrors.phone}</span>}</label>
        <label className="field">E-mail<input name="email" type="email" required defaultValue={account?.email || ""} /></label>
        <label className="field">Ville<input name="city" required defaultValue={account?.city || ""} /></label>
        <label className="field">Quartier ou zone<input name="area" /></label>
      </div>
      <label className="field">Adresse de livraison ou d'installation<input name="addressLine" />{state.fieldErrors?.addressLine && <span className="error">{state.fieldErrors.addressLine}</span>}</label>
      <fieldset>
        <legend>Remise</legend>
        <div className="fields">
          {options.map((option) => (
            <label key={option.id} className="check">
              <input type="radio" name="deliveryOptionId" value={option.id} required />
              <span>
                <strong>{option.name}</strong>
                {option.isDemo ? " · exemple de démonstration" : ""} — {option.feeLabel}
                <br />
                <span className="muted">{option.description} {option.delayNote}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Règlement</legend>
        <div className="fields">
          {methods.map((method) => (
            <label key={method.id} className="check">
              <input type="radio" name="intendedMethod" value={method.id} required />
              <span>
                <strong>{method.label}</strong>
                <br />
                <span className="muted">{method.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">Notes<textarea name="notes" /></label>
      {!account ? (
        <label className="check">
          <input type="checkbox" name="createAccount" value="oui" />
          <span>Créer un compte avec ces coordonnées</span>
        </label>
      ) : null}
      {!account ? <label className="field">Mot de passe du compte, si création<input name="password" type="password" autoComplete="new-password" /></label> : null}
      <Consent />
      <SubmitButton pendingLabel="Enregistrement…">Continuer vers le récapitulatif</SubmitButton>
    </form>
  );
}
