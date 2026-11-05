import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "lapak_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari
export const SESSION_REFRESH_THRESHOLD = 60 * 60 * 24 * 15; // perpanjang saat sisa < 15 hari

export type SessionRole = "owner" | "staff";

export type SessionPayload = {
  sub: string;
  name: string;
  username: string;
  role: SessionRole;
  iat?: number;
  exp?: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET belum diatur (minimal 16 karakter). Lihat .env.example.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: Pick<SessionPayload, "sub" | "name" | "username" | "role">,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
