"use server";

import { redirect } from "next/navigation";

import { db } from "@/db";
import { storeSettings, users } from "@/db/schema";
import {
  authenticate,
  createSession,
  destroySession,
  hasAnyUser,
  hashPassword,
  normalizeUsername,
  safeNextPath,
} from "@/lib/auth";
import type { ActionState } from "@/lib/types";

const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/;

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  const user = await authenticate(username, password);
  if (!user) {
    return { error: "Username atau password salah. Silakan coba lagi." };
  }

  await createSession(user);
  redirect(next);
}

export async function setupAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const storeName = String(formData.get("storeName") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (await hasAnyUser()) {
    return { error: "Akun sudah pernah dibuat. Silakan masuk." };
  }

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Nama minimal 2 karakter.";
  if (storeName.length < 2 || storeName.length > 60) {
    fieldErrors.storeName = "Nama toko harus 2–60 karakter.";
  }
  if (!USERNAME_PATTERN.test(username)) {
    fieldErrors.username =
      "Gunakan 3–24 karakter: huruf kecil, angka, titik, atau garis bawah.";
  }
  if (password.length < 6) fieldErrors.password = "Password minimal 6 karakter.";
  if (password !== confirm) fieldErrors.confirmPassword = "Konfirmasi password tidak sama.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Periksa kembali data yang diisi.", fieldErrors };
  }

  const passwordHash = await hashPassword(password);
  let userId: string;
  try {
    userId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          name,
          username,
          passwordHash,
          role: "owner",
        })
        .returning({ id: users.id });

      await tx
        .insert(storeSettings)
        .values({ id: 1, storeName })
        .onConflictDoUpdate({
          target: storeSettings.id,
          set: { storeName },
        });

      return created.id;
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      return {
        error: "Username sudah dipakai. Pilih username lain.",
        fieldErrors: { username: "Username sudah dipakai." },
      };
    }
    throw error;
  }

  await createSession({ id: userId, name, username, role: "owner" });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
