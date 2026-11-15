import { Flash } from "@/components/admin/nav";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { guard } from "@/lib/guard";
import { saveSiteSettings } from "@/server/admin-actions";

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await guard("settings.write");
  const query = await searchParams;
  const [settings, user] = await Promise.all([getSettings(), currentUser()]);
  const configurePayments = user ? can(user.role, "payments.configure") : false;
  return (
    <div>
      <h1>Réglages</h1>
      <Flash ok={query.ok} />
      <form action={saveSiteSettings} className="fields">
        <label className="check"><input type="checkbox" name="demoMode" value="oui" defaultChecked={settings.demoMode} />Mode démonstration (le site public n'est pas indexé)</label>
        <label className="field">Nom commercial<input name="companyName" defaultValue={settings.companyName} /></label>
        <label className="field">Dénomination<input name="legalName" defaultValue={settings.legalName} /></label>
        <label className="field">Note sur la dénomination<textarea name="legalNameNote" defaultValue={settings.legalNameNote} /></label>
        <label className="field">Signature<input name="tagline" defaultValue={settings.tagline} /></label>
        <label className="field">Titre d'accueil<input name="heroTitle" defaultValue={settings.heroTitle} /></label>
        <label className="field">Sous-titre<textarea name="heroSubtitle" defaultValue={settings.heroSubtitle} /></label>
        <label className="field">Présentation<textarea name="intro" defaultValue={settings.intro} /></label>
        {settings.serviceBlurbs.map((blurb, index) => (
          <label key={index} className="field">Texte du service {index + 1}<textarea name={`service${index}`} defaultValue={blurb} /></label>
        ))}
        <label className="field">Téléphone<input name="phone" defaultValue={settings.phone} placeholder="+224" /></label>
        <label className="field">WhatsApp<input name="whatsapp" defaultValue={settings.whatsapp} placeholder="+224" /></label>
        <label className="field">E-mail<input name="email" defaultValue={settings.email} /></label>
        <label className="field">Adresse<input name="address" defaultValue={settings.address} /></label>
        <label className="field">Ville<input name="city" defaultValue={settings.city} /></label>
        <label className="field">Horaires<input name="hours" defaultValue={settings.hours} /></label>
        <label className="field">Zones d'intervention<textarea name="interventionAreas" defaultValue={settings.interventionAreas} /></label>
        <label className="field">Facebook<input name="facebook" defaultValue={settings.facebook} /></label>
        <label className="field">LinkedIn<input name="linkedin" defaultValue={settings.linkedin} /></label>
        <label className="field">Taux indicatif : 1 GNF vaut combien d'EUR ? Vide pour masquer.<input name="rateEurPerGnf" defaultValue={settings.rateEurPerGnf} /></label>
        <label className="field">Taux indicatif : 1 GNF vaut combien d'USD ?<input name="rateUsdPerGnf" defaultValue={settings.rateUsdPerGnf} /></label>
        {configurePayments ? (
          <fieldset>
            <legend>Moyens proposés au client</legend>
            <p className="muted">Cocher un moyen en ligne ne l'active que si le prestataire est réellement configuré. Orange Money, Visa, Mastercard et PayCard restent masqués tant que les identifiants live et la devise GNF ne sont pas en place.</p>
            <label className="check"><input type="checkbox" name="payOffline" value="oui" defaultChecked={settings.payments.offline} />Paiement hors ligne</label>
            <label className="check"><input type="checkbox" name="payOrange" value="oui" defaultChecked={settings.payments.orangeMoney} />Orange Money, après confirmation du prestataire</label>
            <label className="check"><input type="checkbox" name="payVisa" value="oui" defaultChecked={settings.payments.visa} />Visa</label>
            <label className="check"><input type="checkbox" name="payMastercard" value="oui" defaultChecked={settings.payments.mastercard} />Mastercard</label>
            <label className="check"><input type="checkbox" name="payPaycard" value="oui" defaultChecked={settings.payments.paycard} />PayCard, si le prestataire le couvre</label>
          </fieldset>
        ) : <p className="muted">Les moyens de paiement se modifient avec un compte administration.</p>}
        <button className="btn-primary" type="submit">Enregistrer</button>
      </form>
    </div>
  );
}
