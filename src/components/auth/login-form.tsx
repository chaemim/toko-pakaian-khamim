"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  UserRound,
} from "lucide-react";

import { loginAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { inputClasses, Label } from "@/components/ui/field";
import { EMPTY_ACTION_STATE } from "@/lib/types";

export function LoginForm({
  next,
  showSetup,
}: {
  next: string;
  showSetup: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    EMPTY_ACTION_STATE,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
        Masuk ke toko
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.01em] text-ink">
        Selamat datang kembali
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Masuk untuk mencatat penjualan hari ini dan melihat perkembangan toko.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}

        <div>
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder="contoh: ibu_ani"
              className={`${inputClasses} pl-10`}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Masukkan password"
              className={`${inputClasses} pl-10 pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-cream hover:text-ink"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
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
              Memeriksa…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Masuk
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-muted">
          <LockKeyhole className="h-3 w-3" />
          Sesi tersimpan 30 hari di perangkat ini
        </p>
      </form>

      {showSetup ? (
        <div className="mt-7 rounded-xl border border-line bg-paper px-4 py-3 text-center text-xs text-muted">
          Baru pertama kali memakai?{" "}
          <Link
            href="/setup"
            className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-800"
          >
            Buat akun pemilik
          </Link>
        </div>
      ) : null}
    </div>
  );
}
