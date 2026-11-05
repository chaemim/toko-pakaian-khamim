import { cache } from "react";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  productSizes,
  products,
  saleItems,
  sales,
  storeSettings,
  users,
  type Product,
  type ProductSize,
} from "@/db/schema";
import { addDays, jakartaToday } from "@/lib/date";

export type ProductWithSizes = Product & { sizes: ProductSize[] };

export type RangeSummary = {
  revenue: number;
  cost: number;
  profit: number;
  transactions: number;
  items: number;
};

export type DailyPoint = {
  date: string;
  revenue: number;
  profit: number;
  transactions: number;
};

export type ProductBreakdown = {
  productId: string | null;
  productName: string;
  qty: number;
  revenue: number;
  profit: number;
};

export type SoldItemRow = {
  productId: string | null;
  productName: string;
  sizeLabel: string | null;
  qty: number;
  revenue: number;
  profit: number;
};

export const getStoreSettings = cache(async () => {
  const [row] = await db.select().from(storeSettings).limit(1);
  return (
    row ?? {
      id: 1,
      storeName: "Toko Pakaian",
      tagline: null,
      phone: null,
      address: null,
      receiptNote: null,
      updatedAt: new Date(),
    }
  );
});

export async function getProductsWithSizes(): Promise<ProductWithSizes[]> {
  const [productRows, sizeRows] = await Promise.all([
    db.select().from(products).orderBy(asc(products.name)),
    db
      .select()
      .from(productSizes)
      .orderBy(asc(productSizes.sortOrder), asc(productSizes.label)),
  ]);

  const sizesByProduct = new Map<string, ProductSize[]>();
  for (const size of sizeRows) {
    const list = sizesByProduct.get(size.productId) ?? [];
    list.push(size);
    sizesByProduct.set(size.productId, list);
  }

  return productRows.map((product) => ({
    ...product,
    sizes: sizesByProduct.get(product.id) ?? [],
  }));
}

export async function getProductWithSizes(
  id: string,
): Promise<ProductWithSizes | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return null;

  const sizes = await db
    .select()
    .from(productSizes)
    .where(eq(productSizes.productId, id))
    .orderBy(asc(productSizes.sortOrder), asc(productSizes.label));

  return { ...product, sizes };
}

export async function getRangeSummary(
  from: string,
  to: string,
): Promise<RangeSummary> {
  const range = and(gte(sales.soldOn, from), lte(sales.soldOn, to));

  const [[saleRow], [itemRow]] = await Promise.all([
    db
      .select({
        revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
        cost: sql<number>`coalesce(sum(${sales.totalCost}), 0)`,
        profit: sql<number>`coalesce(sum(${sales.profit}), 0)`,
        transactions: sql<number>`count(*)`,
      })
      .from(sales)
      .where(range),
    db
      .select({
        items: sql<number>`coalesce(sum(${saleItems.qty}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(range),
  ]);

  return {
    revenue: Number(saleRow?.revenue ?? 0),
    cost: Number(saleRow?.cost ?? 0),
    profit: Number(saleRow?.profit ?? 0),
    transactions: Number(saleRow?.transactions ?? 0),
    items: Number(itemRow?.items ?? 0),
  };
}

export async function getSoldItems({
  from,
  to,
  search = "",
}: {
  from: string;
  to: string;
  search?: string;
}): Promise<SoldItemRow[]> {
  const keyword = search.trim();
  const conditions: SQL[] = [
    gte(sales.soldOn, from),
    lte(sales.soldOn, to),
  ];
  if (keyword) {
    const pattern = `%${keyword}%`;
    const searchCondition = or(
      ilike(saleItems.productName, pattern),
      ilike(saleItems.sizeLabel, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const netLine = sql<number>`coalesce(${saleItems.subtotal}::numeric * (${sales.subtotal} - ${sales.discount}) / nullif(${sales.subtotal}, 0), 0)`;

  const rows = await db
    .select({
      productId: saleItems.productId,
      productName: saleItems.productName,
      sizeLabel: saleItems.sizeLabel,
      qty: sql<number>`coalesce(sum(${saleItems.qty}), 0)`,
      revenue: sql<number>`coalesce(round(sum(${netLine})), 0)`,
      profit: sql<number>`coalesce(round(sum(${netLine} - ${saleItems.costPrice} * ${saleItems.qty})), 0)`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(...conditions))
    .groupBy(saleItems.productId, saleItems.productName, saleItems.sizeLabel)
    .orderBy(
      desc(sql`coalesce(round(sum(${netLine})), 0)`),
      asc(saleItems.productName),
      asc(saleItems.sizeLabel),
    );

  return rows.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    sizeLabel: row.sizeLabel,
    qty: Number(row.qty),
    revenue: Number(row.revenue),
    profit: Number(row.profit),
  }));
}

async function getDailySeries(
  from: string,
  to: string,
): Promise<DailyPoint[]> {
  const rows = await db
    .select({
      date: sales.soldOn,
      revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
      profit: sql<number>`coalesce(sum(${sales.profit}), 0)`,
      transactions: sql<number>`count(*)`,
    })
    .from(sales)
    .where(and(gte(sales.soldOn, from), lte(sales.soldOn, to)))
    .groupBy(sales.soldOn)
    .orderBy(asc(sales.soldOn));

  const map = new Map(
    rows.map((row) => [
      row.date,
      {
        date: row.date,
        revenue: Number(row.revenue),
        profit: Number(row.profit),
        transactions: Number(row.transactions),
      } satisfies DailyPoint,
    ]),
  );

  const days: DailyPoint[] = [];
  let cursor = from;
  let guard = 0;
  while (cursor <= to && guard < 400) {
    days.push(
      map.get(cursor) ?? {
        date: cursor,
        revenue: 0,
        profit: 0,
        transactions: 0,
      },
    );
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return days;
}

async function getProductBreakdown(
  from: string,
  to: string,
  limit = 10,
): Promise<ProductBreakdown[]> {
  // Diskon transaksi dialokasikan proporsional ke tiap baris barang supaya
  // total omzet/laba per produk sama dengan ringkasan transaksi.
  const netLine = sql<number>`coalesce(${saleItems.subtotal}::numeric * (${sales.subtotal} - ${sales.discount}) / nullif(${sales.subtotal}, 0), 0)`;
  const rows = await db
    .select({
      productId: saleItems.productId,
      productName: saleItems.productName,
      qty: sql<number>`coalesce(sum(${saleItems.qty}), 0)`,
      revenue: sql<number>`coalesce(round(sum(${netLine})), 0)`,
      profit: sql<number>`coalesce(round(sum(${netLine} - ${saleItems.costPrice} * ${saleItems.qty})), 0)`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(gte(sales.soldOn, from), lte(sales.soldOn, to)))
    .groupBy(saleItems.productId, saleItems.productName)
    .orderBy(desc(sql`coalesce(round(sum(${netLine})), 0)`))
    .limit(limit);

  return rows.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    qty: Number(row.qty),
    revenue: Number(row.revenue),
    profit: Number(row.profit),
  }));
}

export async function getDashboardData() {
  const today = jakartaToday();
  const yesterday = addDays(today, -1);
  const weekStart = addDays(today, -6);
  const monthStart = `${today.slice(0, 7)}-01`;

  const [
    todaySummary,
    yesterdaySummary,
    weekSummary,
    monthSummary,
    daily,
    topProducts,
    recentSales,
    productCount,
  ] = await Promise.all([
    getRangeSummary(today, today),
    getRangeSummary(yesterday, yesterday),
    getRangeSummary(weekStart, today),
    getRangeSummary(monthStart, today),
    getDailySeries(weekStart, today),
    getProductBreakdown(monthStart, today, 5),
    db
      .select({
        id: sales.id,
        invoiceNo: sales.invoiceNo,
        soldOn: sales.soldOn,
        customerName: sales.customerName,
        paymentMethod: sales.paymentMethod,
        total: sales.total,
        profit: sales.profit,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(5),
    db
      .select({ value: count() })
      .from(products)
      .where(eq(products.isActive, true)),
  ]);

  return {
    today,
    yesterday,
    todaySummary,
    yesterdaySummary,
    weekSummary,
    monthSummary,
    daily,
    topProducts,
    recentSales,
    productCount: Number(productCount[0]?.value ?? 0),
  };
}

export type SalesPageParams = {
  from: string;
  to: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getSalesPage({
  from,
  to,
  search = "",
  page = 1,
  pageSize = 15,
}: SalesPageParams) {
  const conditions: SQL[] = [gte(sales.soldOn, from), lte(sales.soldOn, to)];
  const keyword = search.trim();
  if (keyword) {
    const pattern = `%${keyword}%`;
    const searchCondition = or(
      ilike(sales.invoiceNo, pattern),
      ilike(sales.customerName, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  const where = and(...conditions);

  const [[totalRow], rows] = await Promise.all([
    db.select({ value: count() }).from(sales).where(where),
    db
      .select({
        id: sales.id,
        invoiceNo: sales.invoiceNo,
        soldOn: sales.soldOn,
        customerName: sales.customerName,
        paymentMethod: sales.paymentMethod,
        total: sales.total,
        profit: sales.profit,
        createdAt: sales.createdAt,
        itemCount: sql<number>`coalesce(sum(${saleItems.qty}), 0)`,
      })
      .from(sales)
      .leftJoin(saleItems, eq(saleItems.saleId, sales.id))
      .where(where)
      .groupBy(sales.id)
      .orderBy(desc(sales.soldOn), desc(sales.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const total = Number(totalRow?.value ?? 0);

  return {
    rows: rows.map((row) => ({
      ...row,
      itemCount: Number(row.itemCount),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary: await getRangeSummary(from, to),
  };
}

export async function getSaleWithItems(id: string) {
  const [sale] = await db
    .select({
      id: sales.id,
      invoiceNo: sales.invoiceNo,
      soldOn: sales.soldOn,
      customerName: sales.customerName,
      paymentMethod: sales.paymentMethod,
      note: sales.note,
      subtotal: sales.subtotal,
      discount: sales.discount,
      total: sales.total,
      totalCost: sales.totalCost,
      profit: sales.profit,
      createdAt: sales.createdAt,
      createdByName: users.name,
    })
    .from(sales)
    .leftJoin(users, eq(sales.createdBy, users.id))
    .where(eq(sales.id, id))
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, id))
    .orderBy(asc(saleItems.productName), asc(saleItems.sizeLabel));

  return { ...sale, items };
}

export async function getReportData(from: string, to: string) {
  const [summary, daily, topProducts, categories, payments] = await Promise.all([
    getRangeSummary(from, to),
    getDailySeries(from, to),
    getProductBreakdown(from, to, 20),
    db
      .select({
        category: sql<string>`coalesce(${products.category}, 'Tanpa kategori')`,
        qty: sql<number>`coalesce(sum(${saleItems.qty}), 0)`,
        revenue: sql<number>`coalesce(round(sumcoalesce(${saleItems.subtotal}::numeric * (${sales.subtotal} - ${sales.discount}) / nullif(${sales.subtotal}, 0), 0)), 0)`,
        profit: sql<number>`coalesce(round(sum(coalesce(${saleItems.subtotal}::numeric * (${sales.subtotal} - ${sales.discount}) / nullif(${sales.subtotal}, 0), 0) - ${saleItems.costPrice} * ${saleItems.qty})), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(and(gte(sales.soldOn, from), lte(sales.soldOn, to)))
      .groupBy(sql`coalesce(${products.category}, 'Tanpa kategori')`)
      .orderBy(
        desc(
          sql`coalesce(round(sumcoalesce(${saleItems.subtotal}::numeric * (${sales.subtotal} - ${sales.discount}) / nullif(${sales.subtotal}, 0), 0)), 0)`,
        ),
      ),
    db
      .select({
        method: sales.paymentMethod,
        transactions: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
      })
      .from(sales)
      .where(and(gte(sales.soldOn, from), lte(sales.soldOn, to)))
      .groupBy(sales.paymentMethod)
      .orderBy(desc(sql`coalesce(sum(${sales.total}), 0)`)),
  ]);

  return {
    summary,
    daily,
    topProducts,
    categories: categories.map((row) => ({
      ...row,
      qty: Number(row.qty),
      revenue: Number(row.revenue),
      profit: Number(row.profit),
    })),
    payments: payments.map((row) => ({
      ...row,
      transactions: Number(row.transactions),
      revenue: Number(row.revenue),
    })),
  };
}

export async function getSalesForCsv(from: string, to: string) {
  return db
    .select({
      invoiceNo: sales.invoiceNo,
      soldOn: sales.soldOn,
      customerName: sales.customerName,
      paymentMethod: sales.paymentMethod,
      productName: saleItems.productName,
      sizeLabel: saleItems.sizeLabel,
      qty: saleItems.qty,
      costPrice: saleItems.costPrice,
      listPrice: saleItems.listPrice,
      unitPrice: saleItems.unitPrice,
      subtotal: saleItems.subtotal,
      profit: saleItems.profit,
      discount: sales.discount,
      saleSubtotal: sales.subtotal,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(gte(sales.soldOn, from), lte(sales.soldOn, to)))
    .orderBy(asc(sales.soldOn), asc(sales.invoiceNo), asc(saleItems.productName))
    .limit(20000);
}
