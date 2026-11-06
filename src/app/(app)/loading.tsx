/** Tampil seketika saat pindah halaman, selagi data halaman tujuan dimuat. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-brand-100" />
        <div className="h-8 w-56 animate-pulse rounded-xl bg-brand-100/80" />
        <div className="h-3.5 w-72 max-w-full animate-pulse rounded-full bg-line/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-2xl border border-line bg-paper"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-line bg-paper" />
      <span className="sr-only">Memuat…</span>
    </div>
  );
}
