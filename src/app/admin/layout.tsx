import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/nav";
import { currentUser } from "@/lib/auth";
import { isStaff, roleLabel } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/compte/connexion?next=/admin");
  if (!isStaff(user.role)) redirect("/compte");
  return (
    <section className="section wrap admin-shell">
      <AdminNav role={user.role} />
      <div>
        <p className="meta">{user.name} · {roleLabel(user.role)}</p>
        {children}
      </div>
    </section>
  );
}
