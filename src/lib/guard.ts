import { redirect } from "next/navigation";
import { currentUser } from "./auth";
import { can } from "./permissions";

export async function guard(permission: string) {
  const user = await currentUser();
  if (!user) redirect("/compte/connexion?next=/admin");
  if (!can(user.role, permission)) redirect("/admin?erreur=acces");
  return user;
}
