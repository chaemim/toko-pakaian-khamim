const TIME_ZONE = "Asia/Jakarta";

/** Tanggal hari ini di zona waktu Indonesia Barat, format YYYY-MM-DD. */
export function jakartaToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function startOfMonth(dateString: string): string {
  return `${dateString.slice(0, 7)}-01`;
}

export function endOfMonth(dateString: string): string {
  const [year, month] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  if (!isValidDateString(dateString)) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${dateString}T00:00:00Z`));
}

export function formatDateLong(dateString: string): string {
  return formatDate(dateString, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatTime(value: Date | string | null): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function dayLabel(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T00:00:00Z`));
}

export function dayNumber(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T00:00:00Z`));
}

export function rangeLabel(from: string, to: string): string {
  if (from === to) return formatDate(from, { day: "numeric", month: "long", year: "numeric" });
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const fromLabel = formatDate(from, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${fromLabel} – ${formatDate(to, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000) + 1;
}
