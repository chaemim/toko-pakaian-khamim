import type { ReactNode } from "react";
import { BarChart3, Ruler, ShieldCheck, Tags } from "lucide-react";
import { LogoMark } from "@/components/logo";

const features = [
  {
    icon: Tags,
    title: "Harga nego tetap tercatat",
    description: "Simpan harga jual awal dan harga deal tanpa kehilangan margin.",
  },
  {
    icon: Ruler,
    title: "Harga berbeda per ukuran",
    description: "Cocok untuk seragam sekolah dan pakaian dengan ukuran khusus.",
  },
  {
    icon: BarChart3,
    title: "Laba langsung terlihat",
    description: "Omzet, modal, dan keuntungan dihitung otomatis setiap hari.",
  },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-10 text-cream lg:flex xl:p-14">
        <div className="dotted-grid absolute inset-0 opacity-40" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/50 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <LogoMark className="h-11 w-11 bg-paper/10 text-cream ring-1 ring-paper/15 shadow-none" />
            <div>
              <p className="font-display text-2xl font-semibold leading-none">
                Lapak
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-200">
                Catatan penjualan
              </p>
            </div>
          </div>

          <h1 className="mt-16 max-w-md font-display text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.02em] xl:text-5xl">
            Setiap jualan tercatat,
            <br />
            <span className="text-gold-300">setiap untung terlihat.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-100/90">
            Kelola penjualan toko pakaian dari mana saja. Cukup catat, dan
            biarkan aplikasi yang menghitung.
          </p>

          <ul className="mt-10 space-y-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper/10 text-gold-200 ring-1 ring-paper/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-cream">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 max-w-xs text-xs leading-relaxed text-brand-100/75">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative mt-12 flex items-center gap-2 text-[11px] text-brand-200/80">
          <ShieldCheck className="h-4 w-4 text-gold-300" />
          Data tersimpan aman di cloud · Akses khusus pemilik toko
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px] animate-rise">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark className="h-11 w-11" />
            <div>
              <p className="font-display text-2xl font-semibold leading-none text-ink">
                Lapak
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Catatan penjualan
              </p>
            </div>
          </div>
          {children}
          <p className="mt-10 text-center text-[11px] leading-relaxed text-muted">
            Lapak · Aplikasi pencatatan penjualan pakaian
          </p>
        </div>
      </main>
    </div>
  );
}
