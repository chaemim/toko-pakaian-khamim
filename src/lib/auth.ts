import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/db";
import { users } from "@/db/schema";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  role: string;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  return user ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOwner(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/dashboard");
  return user;
}

export async function hasAnyUser(): Promise<boolean> {
  const [result] = await db.select({ value: count() }).from(users);
  return Number(result?.value ?? 0) > 0;
}

export async function createSession(user: CurrentUser) {
  const token = await signSessionToken({
    sub: user.id,
    name: user.name,
    username: user.username,
    role: user.role === "staff" ? "staff" : "owner",
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function authenticate(
  username: string,
  password: string,
): Promise<CurrentUser | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, normalized))
    .limit(1);

  if (!user) {
    // Beri jeda kecil agar percobaan menebak username tidak instan.
    await new Promise((resolve) => setTimeout(resolve, 300));
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value === "/login" || value.startsWith("/login?") || value === "/setup") {
    return "/dashboard";
  }
  return value;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}
