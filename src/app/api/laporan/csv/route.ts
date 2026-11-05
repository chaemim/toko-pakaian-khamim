import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getSalesForCsv } from "@/lib/queries";
import { isValidDateString, jakartaToday, startOfMonth } from "@/lib/date";
import { paymentLabel } from "@/lib/format";

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const today = jakartaToday();
  let from = isValidDateString(params.get("from"))
    ? params.get("from")!
    : startOfMonth(today);
  let to = isValidDateString(params.get("to"))
    ? params.get("to")!
    : today;
  if (from > to) {
    const temp = from;
    from = to;
    to = temp;
  }

  const rows = await getSalesForCsv(from, to);

  const header = [
    "Tanggal",
    "Invoice",
    "Pelanggan",
    "Pembayaran",
    "Produk",
    "Ukuran",
    "Qty",
    "Harga Beli",
    "Harga Daftar",
    "Harga Deal",
    "Subtotal",
    "Diskon Item",
    "Laba Kotor Item",
    "Laba Bersih Item",
  ];

  const lines = [
    header.map(csvCell).join(";"),
    ...rows.map((row) => {
      const discount =
        row.saleSubtotal > 0
          ? Math.round((row.subtotal * row.discount) / row.saleSubtotal)
          : 0;
      return [
        row.soldOn,
        row.invoiceNo,
        row.customerName ?? "",
        paymentLabel(row.paymentMethod),
        row.productName,
        row.sizeLabel ?? "",
        row.qty,
        row.costPrice,
        row.listPrice,
        row.unitPrice,
        row.subtotal,
        discount,
        row.profit,
        row.profit - discount,
      ]
        .map(csvCell)
        .join(";");
    }),
  ];

  const csv = `\uFEFF${lines.join("\r\n")}`;
  const filename = `laporan-penjualan-${from}-sampai-${to}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
