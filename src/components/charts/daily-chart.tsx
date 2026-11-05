import { dayLabel, dayNumber, formatDate } from "@/lib/date";
import { formatRupiah } from "@/lib/format";
import type { DailyPoint } from "@/lib/queries";

export function DailyChart({
  data,
  height = "h-40",
}: {
  data: DailyPoint[];
  height?: string;
}) {
  const max = Math.max(
    ...data.map((point) => Math.max(point.revenue, point.profit)),
    1,
  );
  const labelEvery = data.length > 14 ? Math.ceil(data.length / 10) : 1;

  return (
    <div>
      <div className="hide-scrollbar overflow-x-auto">
        <div
          className="flex items-end gap-1.5 sm:gap-2"
          style={{ minWidth: data.length > 14 ? 720 : undefined }}
        >
          {data.map((point, index) => {
            const revenueHeight = (point.revenue / max) * 100;
            const profitHeight = (point.profit / max) * 100;
            const showLabel =
              labelEvery === 1 ||
              index % labelEvery === 0 ||
              index === data.length - 1;
            const tooltip = `${formatDate(point.date)} — Omzet ${formatRupiah(
              point.revenue,
            )}, laba ${formatRupiah(point.profit)}`;

            return (
              <div
                key={point.date}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className={`relative flex w-full items-end justify-center gap-[3px] ${height}`}
                  title={tooltip}
                >
                  <div
                    className="w-[36%] max-w-4 rounded-t-[4px] bg-brand-200 transition-colors group-hover:bg-brand-300"
                    style={{
                      height: `${revenueHeight > 0 ? Math.max(revenueHeight, 2.5) : 0}%`,
                    }}
                  />
                  <div
                    className="w-[36%] max-w-4 rounded-t-[4px] bg-brand-700 transition-colors group-hover:bg-brand-800"
                    style={{
                      height: `${profitHeight > 0 ? Math.max(profitHeight, 2.5) : 0}%`,
                    }}
                  />
                </div>
                <div className="flex h-7 flex-col items-center justify-start leading-none">
                  <span className="text-[10px] font-semibold text-muted">
                    {showLabel
                      ? data.length > 10
                        ? dayNumber(point.date)
                        : dayLabel(point.date).replace(".", "")
                      : ""}
                  </span>
                  {showLabel && data.length <= 10 ? (
                    <span className="mt-0.5 text-[9px] text-muted/70">
                      {dayNumber(point.date)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-medium text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-brand-200" />
          Omzet
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-brand-700" />
          Laba
        </span>
      </div>
    </div>
  );
}
