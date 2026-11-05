"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDateTime } from "@/lib/date";
import { formatRupiah } from "@/lib/format";
import type { PendingSale } from "@/lib/offline/db";
import {
  observePending,
  removePending,
  retryErrored,
  syncPending,
} from "@/lib/offline/sync";

export function PendingList() {
  const [rows, setRows] = useState<PendingSale[] | null>(null);

  useEffect(() => observePending(setRows), []);

  if (!rows || rows.length === 0) return null;

  const hasError = rows.some((row) => row.status === "error");

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Antrean di perangkat"
        description="Transaksi yang belum masuk ke server."
        action={
          hasError ? (
            <button
              type="button"
              onClick={async () => {
                await retryErrored();
                void syncPending();
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[11px] font-semibold text-brand-700 hover:bg-brand-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Coba lagi
            </button>
          ) : null
        }
      />
      <ul className="divide-y divide-line/70">
        {rows.map((row) => (
          <li key={row.clientId} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">
                {row.summary.label}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {formatDateTime(new Date(row.createdAt))} · {row.summary.qty} pcs ·{" "}
                {formatRupiah(row.summary.total)}
              </p>
              {row.status === "error" && row.error ? (
                <p className="mt-1 text-[11px] font-medium text-rust-600">
                  {row.error}
                </p>
              ) : null}
            </div>
            <Badge tone={row.status === "error" ? "danger" : "gold"}>
              {row.status === "error" ? "Ditolak" : "Menunggu"}
            </Badge>
            {row.status === "error" ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Hapus transaksi ini dari perangkat?")) {
                    void removePending(row.clientId);
                  }
                }}
                aria-label="Hapus dari antrean"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-rust-50 hover:text-rust-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
