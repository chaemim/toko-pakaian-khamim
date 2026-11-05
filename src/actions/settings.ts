"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/db";
import { storeSettings, users } from "@/db/schema";
import {
  hashPassword,
  normalizeUsername,
  requireOwner,
  requireUser,
} from "@/lib/auth";
import type { ActionState } from "@/lib/types";

const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/;

export async function updateProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2 || name.length > 60) {
    return {
      error: "Nama harus 2–60 karakter.",
      fieldErrors: { name: "Nama harus 2–60 karakter." },
    };
  }

  await db.update(users).set({ name }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { success: "Nama berhasil diperbarui." };
}

export async function changePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) {
    return {
      error: "Masukkan password saat ini.",
      fieldErrors: { currentPassword: "Password saat ini wajib diisi." },
    };
  }
  if (newPassword.length < 6) {
    return {
      error: "Password baru minimal 6 karakter.",
      fieldErrors: { newPassword: "Minimal 6 karakter." },
    };
  }
  if (newPassword !== confirmPassword) {
    return {
      error: "Konfirmasi password tidak sama.",
      fieldErrors: { confirmPassword: "Konfirmasi tidak sama." },
    };
  }

  const [record] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!record) {
    return { error: "Akun tidak ditemukan." };
  }

  const valid = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!valid) {
    return {
      error: "Password saat ini salah.",
      fieldErrors: { currentPassword: "Password saat ini salah." },
    };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, user.id));

  return { success: "Password berhasil diganti." };
}

export async function updateStoreAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();

  const storeName = String(formData.get("storeName") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const receiptNote = String(formData.get("receiptNote") ?? "").trim();

  if (storeName.length < 2 || storeName.length > 60) {
    return {
      error: "Nama toko harus 2–60 karakter.",
      fieldErrors: { storeName: "Nama toko harus 2–60 karakter." },
    };
  }
  if (tagline.length > 100) {
    return {
      error: "Tagline maksimal 100 karakter.",
      fieldErrors: { tagline: "Maksimal 100 karakter." },
    };
  }
  if (phone.length > 30) {
    return {
      error: "Nomor telepon maksimal 30 karakter.",
      fieldErrors: { phone: "Maksimal 30 karakter." },
    };
  }
  if (address.length > 160) {
    return {
      error: "Alamat maksimal 160 karakter.",
      fieldErrors: { address: "Maksimal 160 karakter." },
    };
  }
  if (receiptNote.length > 200) {
    return {
      error: "Catatan struk maksimal 200 karakter.",
      fieldErrors: { receiptNote: "Maksimal 200 karakter." },
    };
  }

  await db
    .insert(storeSettings)
    .values({
      id: 1,
      storeName,
      tagline: tagline || null,
      phone: phone || null,
      address: address || null,
      receiptNote: receiptNote || null,
    })
    .onConflictDoUpdate({
      target: storeSettings.id,
      set: {
        storeName,
        tagline: tagline || null,
        phone: phone || null,
        address: address || null,
        receiptNote: receiptNote || null,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/", "layout");
  return { success: "Informasi toko berhasil disimpan." };
}

export async function createUserAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();

  const name = String(formData.get("name") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff") === "owner" ? "owner" : "staff";

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Nama minimal 2 karakter.";
  if (!USERNAME_PATTERN.test(username)) {
    fieldErrors.username =
      "Gunakan 3–24 karakter: huruf kecil, angka, titik, atau garis bawah.";
  }
  if (password.length < 6) fieldErrors.password = "Password minimal 6 karakter.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Periksa kembali data yang diisi.", fieldErrors };
  }

  try {
    await db.insert(users).values({
      name,
      username,
      passwordHash: await hashPassword(password),
      role,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return {
        error: "Username sudah dipakai.",
        fieldErrors: { username: "Username sudah dipakai." },
      };
    }
    throw error;
  }

  revalidatePath("/pengaturan");
  return { success: `Akun ${name} berhasil dibuat.` };
}

export async function deleteUserAction(formData: FormData) {
  const currentUser = await requireOwner();
  const id = String(formData.get("id") ?? "");

  if (!id) return;
  if (id === currentUser.id) {
    redirect(
      `/pengaturan?error=${encodeURIComponent("Anda tidak dapat menghapus akun sendiri.")}`,
    );
  }

  const [target] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target) {
    redirect(
      `/pengaturan?error=${encodeURIComponent("Akun tidak ditemukan.")}`,
    );
  }

  if (target.role === "owner") {
    const [ownerCount] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "owner"));

    if (Number(ownerCount?.value ?? 0) <= 1) {
      redirect(
        `/pengaturan?error=${encodeURIComponent("Minimal harus ada satu akun pemilik.")}`,
      );
    }
  }

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/pengaturan");
  redirect("/pengaturan?status=pengguna-dihapus");
}
