import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SESSION_REFRESH_THRESHOLD,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/setup"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const response = NextResponse.next();

  // Perpanjang sesi secara otomatis agar pengguna tidak sering logout.
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = payload.exp ?? 0;
  if (expiresAt - now < SESSION_REFRESH_THRESHOLD) {
    const refreshed = await signSessionToken({
      sub: payload.sub,
      name: payload.name,
      username: payload.username,
      role: payload.role,
    });
    response.cookies.set(SESSION_COOKIE, refreshed, {
      ...sessionCookieOptions(),
      maxAge: SESSION_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
