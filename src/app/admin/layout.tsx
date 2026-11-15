import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/nav";
import { currentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/compte/connexion?next=/admin");
  if (!isStaff(user.role)) redirect("/compte");
  return (
    <section className="section wrap admin-shell">
      <AdminNav />
      <div>
        <p className="meta">{user.name} · {user.role}</p>
        {children}
      </div>
    </section>
  );
}
