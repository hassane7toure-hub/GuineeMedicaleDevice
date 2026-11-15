import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isStaff } from "@/lib/permissions";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session-token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/compte/connexion")) return NextResponse.next();
  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/compte/connexion";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && !isStaff(session.role)) {
    return NextResponse.redirect(new URL("/compte", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte", "/compte/:path*"],
};
