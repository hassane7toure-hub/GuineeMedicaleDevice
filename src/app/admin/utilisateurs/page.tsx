import { Flash } from "@/components/admin/nav";
import { ROLE_LABELS } from "@/lib/permissions";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { saveUser } from "@/server/admin-actions";

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await guard("users.write");
  const query = await searchParams;
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1>Utilisateurs</h1>
      <Flash ok={query.ok} erreur={query.erreur} />
      <form action={saveUser} className="fields panel" style={{ padding: "1rem" }}>
        <h2>Nouveau compte équipe</h2>
        <label className="field">Nom<input name="name" required /></label>
        <label className="field">E-mail<input name="email" type="email" required /></label>
        <label className="field">Téléphone<input name="phone" /></label>
        <label className="field">Mot de passe<input name="password" type="password" required minLength={12} /></label>
        <label className="field">Rôle
          <select name="role" defaultValue="SALES">
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" name="active" value="oui" defaultChecked />Actif</label>
        <button className="btn-primary" type="submit">Créer</button>
      </form>
      {users.map((user) => (
        <form key={user.id} action={saveUser} className="fields panel" style={{ padding: "1rem", marginTop: "0.6rem" }}>
          <input type="hidden" name="id" value={user.id} />
          <label className="field">Nom<input name="name" defaultValue={user.name} /></label>
          <label className="field">E-mail<input name="email" defaultValue={user.email} /></label>
          <label className="field">Téléphone<input name="phone" defaultValue={user.phone} /></label>
          <label className="field">Nouveau mot de passe, facultatif<input name="password" type="password" /></label>
          <label className="field">Rôle
            <select name="role" defaultValue={user.role}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="check"><input type="checkbox" name="active" value="oui" defaultChecked={user.active} />Actif</label>
          <button className="btn-ghost" type="submit">Enregistrer</button>
        </form>
      ))}
    </div>
  );
}
