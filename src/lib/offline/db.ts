import Dexie, { type Table } from "dexie";

import type { SaleProduct } from "@/components/sales/sale-form";

export type PendingSalePayload = {
  clientId: string;
  /** Waktu transaksi dicatat di perangkat (ms). */
  createdAt: number;
  soldOn: string;
  customerName: string;
  paymentMethod: string;
  discount: number;
  note: string;
  items: { sizeId: string; qty: number; unitPrice: number }[];
};

export type PendingSale = PendingSalePayload & {
  /** pending = menunggu dikirim, error = ditolak server (perlu dicek). */
  status: "pending" | "error";
  error?: string;
  attempts: number;
  /** Ringkasan untuk ditampilkan di daftar antrean. */
  summary: { total: number; qty: number; label: string };
};

type MetaRow = { key: string; value: number };

class LapakDB extends Dexie {
  products!: Table<SaleProduct, string>;
  pending!: Table<PendingSale, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("lapak-offline");
    this.version(1).stores({
      products: "id",
      pending: "clientId, status, createdAt",
      meta: "key",
    });
  }
}

let instance: LapakDB | null = null;

export function getDb(): LapakDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB hanya tersedia di browser.");
  }
  instance ??= new LapakDB();
  return instance;
}
