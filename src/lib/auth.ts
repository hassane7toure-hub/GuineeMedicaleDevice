import { cookies } from "next/headers";
import { db } from "./db";
import { readSessionToken, SESSION_COOKIE, signSession, type SessionPayload } from "./session-token";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function setSession(payload: SessionPayload) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(payload), { ...cookieBase, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function currentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user || !user.active) return null;
  return user;
}
