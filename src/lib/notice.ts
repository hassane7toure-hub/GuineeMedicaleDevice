import { cookies } from "next/headers";
import { readScoped, signScoped } from "./session-token";

const NOTICE = "gmd_notice";
const ACCESS = "gmd_order_access";

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setNotice(kind: string, reference: string) {
  const jar = await cookies();
  jar.set(NOTICE, await signScoped("notice", { kind, reference }, "1d"), { ...base, maxAge: 60 * 60 * 24 });
}

export async function readNotice() {
  const jar = await cookies();
  const payload = await readScoped("notice", jar.get(NOTICE)?.value);
  if (!payload || typeof payload.reference !== "string" || typeof payload.kind !== "string") return null;
  return { kind: payload.kind, reference: payload.reference };
}

export async function grantOrderAccess(reference: string) {
  const jar = await cookies();
  const current = await readScoped("orders", jar.get(ACCESS)?.value);
  const previous = typeof current?.refs === "string" ? current.refs.split(",").filter(Boolean) : [];
  const refs = [reference, ...previous.filter((item) => item !== reference)].slice(0, 10).join(",");
  jar.set(ACCESS, await signScoped("orders", { refs }, "30d"), { ...base, maxAge: 60 * 60 * 24 * 30 });
}

export async function canAccessOrder(reference: string) {
  const jar = await cookies();
  const current = await readScoped("orders", jar.get(ACCESS)?.value);
  const refs = typeof current?.refs === "string" ? current.refs.split(",") : [];
  return refs.includes(reference);
}
