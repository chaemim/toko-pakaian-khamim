"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CloudOff, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import clsx from "clsx";

import { useOnline } from "@/components/offline/use-online";
import type { PendingSale } from "@/lib/offline/db";
import {
  observePending,
  refreshCatalog,
  syncPending,
} from "@/lib/offline/sync";

const CATALOG_MIN_INTERVAL = 60_000;
const RETRY_INTERVAL = 30_000;

/**
 * Dipasang sekali di AppShell (dan halaman /offline). Tugasnya:
 * - menyimpan katalog produk ke perangkat,
 * - mengirim antrean penjualan saat koneksi tersedia,
 * - menampilkan banner status bila offline / ada antrean.
 */
export function OfflineManager({ showListLink = true }: { showListLink?: boolean }) {
  const online = useOnline();
  const [pending, setPending] = useState<PendingSale[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const lastCatalog = useRef(0);

  useEffect(() => observePending(setPending), []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    try {
      const outcome = await syncPending();
      setNeedLogin(outcome.unauthorized);
    } finally {
      setSyncing(false);
    }
  }, []);

  const runCatalog = useCallback(async (force = false) => {
    if (!force && Date.now() - lastCatalog.current < CATALOG_MIN_INTERVAL) {
      return;
    }
    lastCatalog.current = Date.now();
    const result = await refreshCatalog();
    if (result === "unauthorized") setNeedLogin(true);
  }, []);

  // Saat dibuka dan saat koneksi kembali / app kembali ke layar.
  useEffect(() => {
    function onReady() {
      if (!navigator.onLine) return;
      void runSync();
      void runCatalog();
    }
    onReady();
    window.addEventListener("online", onReady);
    function onVisible() {
      if (document.visibilityState === "visible") onReady();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onReady);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [runSync, runCatalog]);

  const waiting = pending.filter((sale) => sale.status === "pending").length;
  const failed = pending.filter((sale) => sale.status === "error").length;

  // Coba lagi berkala selama masih ada antrean (sinyal sering datang-pergi).
  useEffect(() => {
    if (waiting === 0) return;
    const timer = window.setInterval(() => {
      if (navigator.onLine) void runSync();
    }, RETRY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [waiting, runSync]);

  if (online && waiting === 0 && failed === 0 && !needLogin) return null;

  const tone = failed > 0 || needLogin ? "warn" : online ? "info" : "offline";

  let message: string;
  if (needLogin) {
    message = "Sesi login berakhir. Masuk lagi agar transaksi di perangkat ini bisa dikirim.";
  } else if (failed > 0) {
    message = `${failed} transaksi ditolak server dan perlu dicek.`;
  } else if (!online && waiting > 0) {
    message = `Offline · ${waiting} transaksi tersimpan di perangkat, menunggu sinyal.`;
  } else if (!online) {
    message = "Offline · penjualan tetap bisa dicatat dan akan dikirim saat ada sinyal.";
  } else {
    message = `${waiting} transaksi menunggu dikirim.`;
  }

  const Icon = needLogin || failed > 0 ? TriangleAlert : online ? RefreshCw : CloudOff;

  return (
    <div
      role="status"
      className={clsx(
        "no-print mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold",
        tone === "warn" && "border-rust-100 bg-rust-50 text-rust-600",
        tone === "info" && "border-brand-200 bg-brand-50 text-brand-800",
        tone === "offline" && "border-gold-200 bg-gold-50 text-gold-700",
      )}
    >
      <Icon className={clsx("h-4 w-4 shrink-0", syncing && "animate-spin")} />
      <span className="min-w-0 flex-1">{message}</span>
      <span className="flex items-center gap-2">
        {needLogin ? (
          <Link href="/login" className="underline underline-offset-2">
            Masuk
          </Link>
        ) : null}
        {online && (waiting > 0 || failed > 0) && !needLogin ? (
          <button
            type="button"
            onClick={() => void runSync()}
            disabled={syncing}
            className="inline-flex items-center gap-1 rounded-full border border-current/30 px-2.5 py-1 disabled:opacity-60"
          >
            {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Sinkron sekarang
          </button>
        ) : null}
        {showListLink && (waiting > 0 || failed > 0) ? (
          <Link href="/offline" className="underline underline-offset-2">
            Lihat antrean
          </Link>
        ) : null}
      </span>
    </div>
  );
}
