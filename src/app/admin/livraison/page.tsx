import { Flash } from "@/components/admin/nav";
import { db } from "@/lib/db";
import { formatGnf } from "@/lib/format";
import { guard } from "@/lib/guard";
import { saveDelivery } from "@/server/admin-actions";

export default async function DeliveryAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await guard("delivery.write");
  const query = await searchParams;
  const options = await db.deliveryOption.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1>Livraison, retrait, installation</h1>
      <Flash ok={query.ok} erreur={query.erreur} />
      <p className="muted">Les frais marqués « à confirmer » ne sont pas ajoutés au total. Décochez « démonstration » seulement quand l'option est réelle.</p>
      <form action={saveDelivery} className="fields panel" style={{ padding: "1rem" }}>
        <label className="field">Nom<input name="name" required /></label>
        <label className="field">Description<textarea name="description" /></label>
        <label className="field">Type
          <select name="fulfillment"><option value="DELIVERY">Livraison</option><option value="PICKUP">Retrait</option><option value="INSTALLATION">Installation</option></select>
        </label>
        <label className="field">Frais GNF<input name="feeGnf" inputMode="numeric" /></label>
        <label className="check"><input type="checkbox" name="feePending" value="oui" />Frais à confirmer</label>
        <label className="field">Délai indicatif<input name="delayNote" /></label>
        <label className="field">Ordre<input name="sortOrder" defaultValue="0" /></label>
        <label className="check"><input type="checkbox" name="active" value="oui" defaultChecked />Active</label>
        <label className="check"><input type="checkbox" name="isDemo" value="oui" />Démonstration</label>
        <button className="btn-primary" type="submit">Ajouter</button>
      </form>
      {options.map((option) => (
        <form key={option.id} action={saveDelivery} className="fields panel" style={{ padding: "1rem", marginTop: "0.6rem" }}>
          <input type="hidden" name="id" value={option.id} />
          <label className="field">Nom<input name="name" defaultValue={option.name} /></label>
          <label className="field">Description<textarea name="description" defaultValue={option.description} /></label>
          <label className="field">Type
            <select name="fulfillment" defaultValue={option.fulfillment}>
              <option value="DELIVERY">Livraison</option>
              <option value="PICKUP">Retrait</option>
              <option value="INSTALLATION">Installation</option>
            </select>
          </label>
          <p>Frais actuels : {option.feePending || option.feeGnf === null ? "à confirmer" : formatGnf(option.feeGnf)}</p>
          <label className="field">Frais GNF<input name="feeGnf" defaultValue={option.feeGnf === null ? "" : String(option.feeGnf)} /></label>
          <label className="check"><input type="checkbox" name="feePending" value="oui" defaultChecked={option.feePending} />Frais à confirmer</label>
          <label className="field">Délai indicatif<input name="delayNote" defaultValue={option.delayNote} /></label>
          <label className="field">Ordre<input name="sortOrder" defaultValue={option.sortOrder} /></label>
          <label className="check"><input type="checkbox" name="active" value="oui" defaultChecked={option.active} />Active</label>
          <label className="check"><input type="checkbox" name="isDemo" value="oui" defaultChecked={option.isDemo} />Démonstration</label>
          <button className="btn-ghost" type="submit">Enregistrer</button>
        </form>
      ))}
    </div>
  );
}
