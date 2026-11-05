import { liveQuery } from "dexie";

import type { SaleProduct } from "@/components/sales/sale-form";
import {
  getDb,
  type PendingSale,
  type PendingSalePayload,
} from "@/lib/offline/db";

/* ------------------------------------------------------------------ */
/* Katalog produk                                                      */
/* ------------------------------------------------------------------ */

export async function refreshCatalog(): Promise<
  "ok" | "unauthorized" | "failed"
> {
  try {
    const response = await fetch("/api/katalog", { cache: "no-store" });
    if (response.status === 401) return "unauthorized";
    if (!response.ok) return "failed";

    const data = (await response.json()) as {
      products: SaleProduct[];
      updatedAt: number;
    };
    if (!Array.isArray(data.products)) return "failed";

    const db = getDb();
    await db.transaction("rw", db.products, db.meta, async () => {
      await db.products.clear();
      await db.products.bulkPut(data.products);
      await db.meta.put({ key: "catalogUpdatedAt", value: data.updatedAt });
    });
    return "ok";
  } catch {
    return "failed";
  }
}

export async function loadCatalog(): Promise<SaleProduct[]> {
  const rows = await getDb().products.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/* ------------------------------------------------------------------ */
/* Antrean penjualan                                                   */
/* ------------------------------------------------------------------ */

export type SaleDraft = Omit<PendingSalePayload, "clientId" | "createdAt">;

export async function enqueueSale(
  draft: SaleDraft,
  products: SaleProduct[],
): Promise<PendingSale> {
  const sizeMap = new Map<string, { name: string; label: string }>();
  for (const product of products) {
    for (const size of product.sizes) {
      sizeMap.set(size.id, { name: product.name, label: size.label });
    }
  }

  const subtotal = draft.items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0,
  );
  const qty = draft.items.reduce((sum, item) => sum + item.qty, 0);
  const first = draft.items[0] ? sizeMap.get(draft.items[0].sizeId) : undefined;
  const extra = draft.items.length - 1;

  const record: PendingSale = {
    ...draft,
    clientId: crypto.randomUUID(),
    createdAt: Date.now(),
    status: "pending",
    attempts: 0,
    summary: {
      total: Math.max(subtotal - draft.discount, 0),
      qty,
      label: first
        ? `${first.name} ${first.label}${extra > 0 ? ` +${extra} lainnya` : ""}`
        : `${qty} pcs`,
    },
  };

  await getDb().pending.put(record);
  return record;
}

export async function removePending(clientId: string) {
  await getDb().pending.delete(clientId);
}

export async function retryErrored() {
  await getDb()
    .pending.where("status")
    .equals("error")
    .modify({ status: "pending", error: undefined });
}

type SyncItemResult =
  | { clientId: string | null; ok: true; saleId: string; invoiceNo: string }
  | { clientId: string | null; ok: false; error: string; retryable: boolean };

export type SyncOutcome = {
  /** clientId -> hasil untuk transaksi yang berhasil tersimpan di server. */
  saved: Record<string, { saleId: string; invoiceNo: string }>;
  unauthorized: boolean;
  networkError: boolean;
};

const BATCH_SIZE = 20;
let running: Promise<SyncOutcome> | null = null;

/** Kirim semua antrean "pending". Aman dipanggil berkali-kali (satu proses). */
export function syncPending(): Promise<SyncOutcome> {
  running ??= doSync().finally(() => {
    running = null;
  });
  return running;
}

async function doSync(): Promise<SyncOutcome> {
  const db = getDb();
  const outcome: SyncOutcome = {
    saved: {},
    unauthorized: false,
    networkError: false,
  };

  const queue = (await db.pending.where("status").equals("pending").toArray())
    .sort((a, b) => a.createdAt - b.createdAt);

  for (let start = 0; start < queue.length; start += BATCH_SIZE) {
    const batch = queue.slice(start, start + BATCH_SIZE);

    let response: Response;
    try {
      response = await fetch("/api/sales/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales: batch.map((sale) => ({
            clientId: sale.clientId,
            createdAt: sale.createdAt,
            soldOn: sale.soldOn,
            customerName: sale.customerName,
            paymentMethod: sale.paymentMethod,
            discount: sale.discount,
            note: sale.note,
            items: sale.items,
          })),
        }),
      });
    } catch {
      outcome.networkError = true;
      break;
    }

    if (response.status === 401) {
      outcome.unauthorized = true;
      break;
    }
    if (!response.ok) {
      // 5xx / 4xx tak terduga: biarkan tetap antre, coba lagi nanti.
      outcome.networkError = true;
      break;
    }

    let results: SyncItemResult[];
    try {
      results = ((await response.json()) as { results: SyncItemResult[] }).results;
    } catch {
      outcome.networkError = true;
      break;
    }

    for (const result of results) {
      if (!result.clientId) continue;
      if (result.ok) {
        outcome.saved[result.clientId] = {
          saleId: result.saleId,
          invoiceNo: result.invoiceNo,
        };
        await db.pending.delete(result.clientId);
      } else if (result.retryable) {
        await db.pending
          .where("clientId")
          .equals(result.clientId)
          .modify((row) => {
            row.attempts += 1;
            row.error = result.error;
          });
      } else {
        await db.pending
          .where("clientId")
          .equals(result.clientId)
          .modify((row) => {
            row.attempts += 1;
            row.status = "error";
            row.error = result.error;
          });
      }
    }
  }

  return outcome;
}

/* ------------------------------------------------------------------ */
/* Observasi antrean (untuk UI)                                        */
/* ------------------------------------------------------------------ */

export function observePending(
  callback: (rows: PendingSale[]) => void,
): () => void {
  const subscription = liveQuery(() =>
    getDb().pending.orderBy("createdAt").toArray(),
  ).subscribe({
    next: callback,
    error: () => callback([]),
  });
  return () => subscription.unsubscribe();
}
