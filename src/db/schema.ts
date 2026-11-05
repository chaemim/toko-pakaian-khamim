import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey().default(1),
  storeName: text("store_name").notNull().default("Toko Pakaian"),
  tagline: text("tagline"),
  phone: text("phone"),
  address: text("address"),
  receiptNote: text("receipt_note"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_username_unique").on(table.username)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category"),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("products_name_idx").on(table.name)],
);

export const productSizes = pgTable(
  "product_sizes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    costPrice: integer("cost_price").notNull().default(0),
    sellingPrice: integer("selling_price").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("product_sizes_product_label_unique").on(
      table.productId,
      table.label,
    ),
  ],
);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceNo: text("invoice_no").notNull(),
    soldOn: date("sold_on").notNull(),
    customerName: text("customer_name"),
    paymentMethod: text("payment_method").notNull().default("cash"),
    note: text("note"),
    subtotal: integer("subtotal").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull().default(0),
    totalCost: integer("total_cost").notNull().default(0),
    profit: integer("profit").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sales_invoice_unique").on(table.invoiceNo),
    index("sales_sold_on_idx").on(table.soldOn),
    index("sales_created_at_idx").on(table.createdAt),
  ],
);

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    sizeLabel: text("size_label"),
    qty: integer("qty").notNull().default(1),
    costPrice: integer("cost_price").notNull().default(0),
    listPrice: integer("list_price").notNull().default(0),
    unitPrice: integer("unit_price").notNull().default(0),
    subtotal: integer("subtotal").notNull().default(0),
    profit: integer("profit").notNull().default(0),
  },
  (table) => [
    index("sale_items_sale_idx").on(table.saleId),
    index("sale_items_product_idx").on(table.productId),
  ],
);

export const productsRelations = relations(products, ({ many }) => ({
  sizes: many(productSizes),
  saleItems: many(saleItems),
}));

export const productSizesRelations = relations(productSizes, ({ one }) => ({
  product: one(products, {
    fields: [productSizes.productId],
    references: [products.id],
  }),
}));

export const salesRelations = relations(sales, ({ many, one }) => ({
  items: many(saleItems),
  creator: one(users, {
    fields: [sales.createdBy],
    references: [users.id],
  }),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export type StoreSettings = typeof storeSettings.$inferSelect;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductSize = typeof productSizes.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
