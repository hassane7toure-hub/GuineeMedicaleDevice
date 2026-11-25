import { Flash } from "@/components/admin/nav";
import { ImportNotice, SheetExchange } from "@/components/admin/sheet-exchange";
import { parseRoles, ROLE_LABELS } from "@/lib/permissions";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { importUsers, saveUser } from "@/server/admin-actions";

export default async function UsersAdmin({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; crees?: string; ignores?: string; detail?: string }>;
}) {
  await guard("users.write");
  const query = await searchParams;
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1>Utilisateurs</h1>
      {query.ok === "import" ? <ImportNotice {...query} noun="utilisateur" /> : <Flash ok={query.ok} erreur={query.erreur} />}
      <SheetExchange
        heading="Fichier"
        help="Créez de nouveaux comptes. Le mot de passe n'est jamais exporté : il est obligatoire dans le fichier d'import, avec au moins 12 caractères, une lettre et un chiffre. Un e-mail déjà utilisé est ignoré. Plusieurs rôles se séparent par une virgule : Administration, Direction opérationnelle, Commercial, Catalogue, Support technique, Client."
        action={importUsers}
        csvHref="/api/admin/export?type=users&format=csv"
        xlsxHref="/api/admin/export?type=users&format=xlsx"
        modelCsv="/api/admin/export?type=users&format=csv&modele=1"
        modelXlsx="/api/admin/export?type=users&format=xlsx&modele=1"
      />
      <form action={saveUser} className="fields panel" style={{ padding: "1rem" }}>
        <h2>Nouveau compte équipe</h2>
        <label className="field">Nom<input name="name" required /></label>
        <label className="field">E-mail<input name="email" type="email" required /></label>
        <label className="field">Téléphone<input name="phone" /></label>
        <label className="field">Mot de passe<input name="password" type="password" required minLength={12} /></label>
        <RoleFields selected={["SALES"]} />
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
          <RoleFields selected={parseRoles(user.role)} />
          <label className="check"><input type="checkbox" name="active" value="oui" defaultChecked={user.active} />Actif</label>
          <button className="btn-ghost" type="submit">Enregistrer</button>
        </form>
      ))}
    </div>
  );
}

function RoleFields({ selected }: { selected: string[] }) {
  return (
    <fieldset>
      <legend>Rôles</legend>
      <p className="muted">Plusieurs rôles peuvent être cochés. Les droits s'additionnent.</p>
      {Object.entries(ROLE_LABELS).map(([value, label]) => (
        <label key={value} className="check">
          <input type="checkbox" name="roles" value={value} defaultChecked={selected.includes(value)} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
