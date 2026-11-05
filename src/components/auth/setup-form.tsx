"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";

import { setupAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { inputClasses, Label } from "@/components/ui/field";
import { EMPTY_ACTION_STATE, firstError } from "@/lib/types";

export function SetupForm() {
  const [state, formAction, pending] = useActionState(
    setupAction,
    EMPTY_ACTION_STATE,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
        Persiapan pertama
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.01em] text-ink">
        Buat akun pemilik
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Isi data toko dan akun Anda. Setelah ini, semua data penjualan bisa
        langsung dicatat.
      </p>

      <form action={formAction} className="mt-7 space-y-4">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}

        <div>
          <Label htmlFor="storeName">Nama toko</Label>
          <div className="relative">
            <Store className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="storeName"
              name="storeName"
              type="text"
              required
              maxLength={60}
              placeholder="Contoh: Toko Berkah Pakaian"
              className={`${inputClasses} pl-10`}
            />
          </div>
          {firstError(state, "storeName") ? (
            <p className="mt-1.5 text-xs text-rust-600">
              {firstError(state, "storeName")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="name">Nama Anda</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={60}
              placeholder="Nama pemilik"
              className={`${inputClasses} pl-10`}
            />
          </div>
          {firstError(state, "name") ? (
            <p className="mt-1.5 text-xs text-rust-600">
              {firstError(state, "name")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">
              @
            </span>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoCapitalize="none"
              spellCheck={false}
              placeholder="huruf kecil, tanpa spasi"
              className={`${inputClasses} pl-9`}
            />
          </div>
          {firstError(state, "username") ? (
            <p className="mt-1.5 text-xs text-rust-600">
              {firstError(state, "username")}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted">
              3–24 karakter: huruf kecil, angka, titik, atau garis bawah.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Min. 6 karakter"
                className={`${inputClasses} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-cream hover:text-ink"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {firstError(state, "password") ? (
              <p className="mt-1.5 text-xs text-rust-600">
                {firstError(state, "password")}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Ulangi password</Label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Ulangi password"
              className={inputClasses}
            />
            {firstError(state, "confirmPassword") ? (
              <p className="mt-1.5 text-xs text-rust-600">
                {firstError(state, "confirmPassword")}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-sm font-semibold text-paper shadow-[0_14px_30px_-16px_rgba(18,55,39,0.95)] transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyiapkan toko…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Buat akun & mulai
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-muted">
          <LockKeyhole className="h-3 w-3" />
          Hanya pemilik toko yang bisa membuat akun pertama
        </p>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-800"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
