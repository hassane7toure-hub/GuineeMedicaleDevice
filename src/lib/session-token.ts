import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "gmd_session";

export type SessionPayload = {
  sub: string;
  role: string;
  email: string;
  name: string;
};

function secret() {
  const value = process.env.SESSION_SECRET ?? "";
  if (value.length < 24) {
    throw new Error("SESSION_SECRET manquant ou trop court.");
  }
  if (process.env.NODE_ENV === "production" && /dev-only|changeme|change-me|replace-with/i.test(value)) {
    throw new Error("SESSION_SECRET de démonstration refusé en production.");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .setAudience("session")
    .sign(secret());
}

export async function readSessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: "session" });
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;
    return {
      sub: payload.sub,
      role: payload.role,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export async function signScoped(audience: string, data: Record<string, string>, expires = "14d") {
  return new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .setAudience(audience)
    .sign(secret());
}

export async function readScoped(audience: string, token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience });
    return payload;
  } catch {
    return null;
  }
}
