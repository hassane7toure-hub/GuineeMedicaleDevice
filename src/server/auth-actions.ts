"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { clearSession, currentUser, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema, registerSchema, safeNext } from "@/lib/validators";
import { isStaff } from "@/lib/permissions";
import type { ActionState } from "./public-actions";

let dummyHash: Promise<string> | null = null;

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Identifiants incorrects." };
  const email = parsed.data.email.toLowerCase();
  const allowed = await rateLimit(`login:${await clientIp()}:${email}`, 8, 15 * 60 * 1000);
  if (!allowed) return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
  const user = await db.user.findUnique({ where: { email } });
  dummyHash ??= bcrypt.hash("not-used-for-login", 12);
  const hash = user?.passwordHash || (await dummyHash);
  const match = await bcrypt.compare(parsed.data.password, hash);
  if (!user || !user.active || !match) return { ok: false, message: "Identifiants incorrects." };
  await setSession({ sub: user.id, role: user.role, email: user.email, name: user.name });
  await audit({ userId: user.id, action: "auth.login", entity: "user", entityId: user.id });
  const next = safeNext(String(formData.get("next") || ""));
  redirect(isStaff(user.role) && next === "/compte" ? "/admin" : next);
}

export async function register(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    organization: formData.get("organization") || "",
    city: formData.get("city") || "",
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors: fieldErrors(parsed.error) };
  const allowed = await rateLimit(`register:${await clientIp()}`, 5, 60 * 60 * 1000);
  if (!allowed) return { ok: false, message: "Trop de créations de compte. Réessayez plus tard." };
  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false, message: "Un compte existe déjà avec cet e-mail. Connectez-vous." };
  const user = await db.user.create({
    data: {
      email,
      name: parsed.data.name,
      phone: parsed.data.phone || "",
      organization: parsed.data.organization || "",
      city: parsed.data.city || "",
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: "CUSTOMER",
    },
  });
  await setSession({ sub: user.id, role: user.role, email: user.email, name: user.name });
  redirect("/compte");
}

export async function logout() {
  const user = await currentUser();
  if (user) await audit({ userId: user.id, action: "auth.logout", entity: "user", entityId: user.id });
  await clearSession();
  redirect("/");
}

export async function updateProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await currentUser();
  if (!user) redirect("/compte/connexion");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const organization = String(formData.get("organization") || "").trim();
  const city = String(formData.get("city") || "").trim();
  if (name.length < 2) return { ok: false, message: "Le nom est trop court." };
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  let passwordHash = user.passwordHash;
  if (newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return { ok: false, message: "Le mot de passe actuel est incorrect." };
    if (newPassword.length < 12 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return { ok: false, message: "Le nouveau mot de passe doit contenir 12 caractères, une lettre et un chiffre." };
    }
    passwordHash = await bcrypt.hash(newPassword, 12);
  }
  await db.user.update({
    where: { id: user.id },
    data: { name, phone, organization, city, passwordHash },
  });
  await setSession({ sub: user.id, role: user.role, email: user.email, name });
  return { ok: true, message: "Profil mis à jour." };
}
