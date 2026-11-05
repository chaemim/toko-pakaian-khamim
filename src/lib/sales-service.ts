import "server-only";

import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { productSizes, products, saleItems, sales } from "@/db/schema";
import { isValidDateString } from "@/lib/date";

const itemSchema = z.object({
  sizeId: z.string().uuid("Ukuran tidak valid."),
  qty: z.coerce.number().int().min(1).max(999),
  unitPrice: z.coerce.number().int().min(0).max(1_000_000_000),
});

export const saleInputSchema = z.object({
  soldOn: z.string().refine(isValidDateString, "Tanggal tidak valid."),
  customerName: z.string().trim().max(80).optional().default(""),
  paymentMethod: z.enum(["cash", "transfer", "qris", "other"]),
  discount: z.coerce.number().int().min(0).max(1_000_000_000),
  note: z.string().trim().max(300).optional().default(""),
  items: z.array(itemSchema).min(1, "Tambahkan minimal satu barang.").max(100),
});

export type SaleInput = z.output<typeof saleInputSchema>;

export type CreateSaleResult =
  | { ok: true; saleId: string; invoiceNo: string; duplicate: boolean }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
      /** true = kemungkinan berhasil kalau dicoba lagi nanti. */
      retryable: boolean;
    };

function invoicePrefix(soldOn: string) {
  return `INV-${soldOn.replaceAll("-", "")}`;
}

type Executor = Pick<typeof db, "select" | "execute">;

/**
 * Nomor urut berikutnya untuk tanggal tersebut. Memakai angka terbesar yang
 * sudah ada (bukan transaksi terakhir yang dibuat), karena penjualan offline
 * bisa masuk belakangan dengan waktu yang lebih awal.
 */
async function nextInvoiceNo(executor: Executor, soldOn: string) {
  const prefix = invoicePrefix(soldOn);
  const [row] = await executor
    .select({
      max: sql<number>`coalesce(max(cast(substring(${sales.invoiceNo} from '[0-9]+$') as integer)), 0)`,
    })
    .from(sales)
    .where(eq(sales.soldOn, soldOn));

  const sequence = Number(row?.max ?? 0) + 1;
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

async function findByClientId(executor: Executor, clientId: string) {
  const [existing] = await executor
    .select({ id: sales.id, invoiceNo: sales.invoiceNo })
    .from(sales)
    .where(eq(sales.clientId, clientId))
    .limit(1);
  return existing ?? null;
}

export async function createSale(
  input: SaleInput,
  userId: string,
  options: { clientId?: string; createdAt?: Date } = {},
): Promise<CreateSaleResult> {
  const { clientId } = options;

  // Sudah pernah tersimpan (mis. sinyal putus setelah server menyimpan).
  if (clientId) {
    const existing = await findByClientId(db, clientId);
    if (existing) {
      return {
        ok: true,
        saleId: existing.id,
        invoiceNo: existing.invoiceNo,
        duplicate: true,
      };
    }
  }

  // Gabungkan baris dengan ukuran yang sama.
  const merged = new Map<
    string,
    { sizeId: string; qty: number; unitPrice: number }
  >();
  for (const item of input.items) {
    const current = merged.get(item.sizeId);
    if (current) {
      current.qty += item.qty;
    } else {
      merged.set(item.sizeId, { ...item });
    }
  }

  const sizeIds = [...merged.keys()];
  const rows = await db
    .select({
      sizeId: productSizes.id,
      sizeLabel: productSizes.label,
      costPrice: productSizes.costPrice,
      sellingPrice: productSizes.sellingPrice,
      productId: products.id,
      productName: products.name,
    })
    .from(productSizes)
    .innerJoin(products, eq(productSizes.productId, products.id))
    .where(inArray(productSizes.id, sizeIds));

  if (rows.length !== sizeIds.length) {
    return {
      ok: false,
      retryable: false,
      error:
        "Sebagian produk atau ukuran sudah tidak tersedia. Muat ulang halaman lalu pilih ulang barangnya.",
      fieldErrors: { items: "Produk/ukuran tidak ditemukan." },
    };
  }

  const sizeMap = new Map(rows.map((row) => [row.sizeId, row]));

  const preparedItems = [...merged.values()].map((item) => {
    const size = sizeMap.get(item.sizeId)!;
    const subtotal = item.qty * item.unitPrice;
    return {
      productId: size.productId,
      productName: size.productName,
      sizeLabel: size.sizeLabel,
      qty: item.qty,
      costPrice: size.costPrice,
      listPrice: size.sellingPrice,
      unitPrice: item.unitPrice,
      subtotal,
      profit: (item.unitPrice - size.costPrice) * item.qty,
    };
  });

  const subtotal = preparedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const grossProfit = preparedItems.reduce((sum, item) => sum + item.profit, 0);
  const totalCost = preparedItems.reduce(
    (sum, item) => sum + item.costPrice * item.qty,
    0,
  );

  if (input.discount > subtotal) {
    return {
      ok: false,
      retryable: false,
      error: "Diskon tidak boleh melebihi subtotal.",
      fieldErrors: { discount: "Diskon melebihi subtotal." },
    };
  }

  const total = subtotal - input.discount;
  const profit = grossProfit - input.discount;

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const outcome = await db.transaction(async (tx) => {
        // Kunci per tanggal: penomoran invoice dan cek duplikat berjalan
        // satu per satu, jadi tidak ada bentrok walau ada beberapa request
        // sinkronisasi bersamaan (lock otomatis lepas saat transaksi selesai).
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${invoicePrefix(input.soldOn)}))`,
        );

        if (clientId) {
          const existing = await findByClientId(tx, clientId);
          if (existing) {
            return {
              saleId: existing.id,
              invoiceNo: existing.invoiceNo,
              duplicate: true,
            };
          }
        }

        const invoiceNo = await nextInvoiceNo(tx, input.soldOn);

        const [sale] = await tx
          .insert(sales)
          .values({
            invoiceNo,
            clientId: clientId ?? null,
            soldOn: input.soldOn,
            customerName: input.customerName || null,
            paymentMethod: input.paymentMethod,
            note: input.note || null,
            subtotal,
            discount: input.discount,
            total,
            totalCost,
            profit,
            createdBy: userId,
            ...(options.createdAt ? { createdAt: options.createdAt } : {}),
          })
          .returning({ id: sales.id });

        await tx.insert(saleItems).values(
          preparedItems.map((item) => ({
            saleId: sale.id,
            ...item,
          })),
        );

        return { saleId: sale.id, invoiceNo, duplicate: false };
      });

      return { ok: true, ...outcome };
    } catch (error) {
      lastError = error;
      if ((error as { code?: string }).code !== "23505") break;
      // Cadangan: kalau tetap bentrok (mis. sumber lain menulis invoice
      // yang sama), cek duplikat clientId lalu ulangi.
      if (clientId) {
        const existing = await findByClientId(db, clientId);
        if (existing) {
          return {
            ok: true,
            saleId: existing.id,
            invoiceNo: existing.invoiceNo,
            duplicate: true,
          };
        }
      }
    }
  }

  console.error("Gagal menyimpan penjualan", lastError);
  return {
    ok: false,
    retryable: true,
    error: "Penjualan gagal disimpan. Silakan coba lagi sebentar lagi.",
  };
}
