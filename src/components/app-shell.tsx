"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Plus,
  ReceiptText,
  Settings,
  Shirt,
  UserRound,
} from "lucide-react";
import clsx from "clsx";

import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/logo";
import { OfflineManager } from "@/components/offline/offline-manager";
import { buttonClasses } from "@/components/ui/button";
import { initials } from "@/lib/format";

const mainNav = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/penjualan", label: "Penjualan", icon: ReceiptText },
  { href: "/produk", label: "Produk", icon: Shirt },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

const mobileNav = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/produk", label: "Produk", icon: Shirt },
  { href: "/penjualan", label: "Penjualan", icon: ReceiptText },
  { href: "/pengaturan", label: "Akun", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Halaman "catat penjualan baru" ditandai oleh tombol Jual, bukan menu Penjualan.
function isMobileActive(pathname: string, href: string) {
  if (href === "/penjualan" && isActive(pathname, "/penjualan/baru")) {
    return false;
  }
  return isActive(pathname, href);
}

export function AppShell({
  user,
  storeName,
  children,
}: {
  user: { name: string; username: string; role: string };
  storeName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-paper lg:flex">
        <div className="px-5 pb-4 pt-6">
          <Logo storeName={storeName} subtitle="Lapak · Catatan penjualan" />
        </div>

        <div className="px-3">
          <Link
            href="/penjualan/baru"
            className={buttonClasses({
              className: "w-full shadow-lift",
            })}
          >
            <Plus className="h-4 w-4" />
            Catat Penjualan
          </Link>
        </div>

        <nav className="mt-6 flex-1 space-y-1 px-3" aria-label="Navigasi utama">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-brand-700 text-paper shadow-[0_10px_24px_-18px_rgba(18,55,39,0.95)]"
                    : "text-muted hover:bg-brand-50 hover:text-brand-800",
                )}
              >
                <Icon
                  className={clsx(
                    "h-[18px] w-[18px] shrink-0 transition",
                    active ? "text-paper" : "text-muted group-hover:text-brand-700",
                  )}
                />
                {item.label}
                {active ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-300" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line/80 p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-cream/70 p-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-bold text-paper">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">{user.name}</p>
              <p className="truncate text-[10px] text-muted">
                {user.role === "owner" ? "Pemilik" : "Staf"} · @{user.username}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Keluar"
                aria-label="Keluar"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-rust-50 hover:text-rust-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="app-shell-body lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/80 bg-cream/85 px-4 backdrop-blur-md sm:px-6 lg:hidden">
          <Logo storeName={storeName} compact className="max-w-[70%]" />
          <Link
            href="/pengaturan"
            aria-label="Buka pengaturan akun"
            className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-xs font-bold text-paper"
          >
            {initials(user.name)}
          </Link>
        </header>

        <main className="print-reset mx-auto w-full max-w-[1200px] px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">
          <OfflineManager />
          {children}
        </main>
      </div>

      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Navigasi bawah"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-2">
          {mobileNav.slice(0, 2).map((item) => (
            <MobileNavItem
              key={item.href}
              item={item}
              active={isMobileActive(pathname, item.href)}
            />
          ))}

          <div className="relative flex h-16 items-start justify-center">
            <Link
              href="/penjualan/baru"
              className="group -mt-5 flex flex-col items-center gap-1"
              aria-label="Catat penjualan baru"
              aria-current={isActive(pathname, "/penjualan/baru") ? "page" : undefined}
            >
              <span
                className={clsx(
                  "grid h-[52px] w-[52px] place-items-center rounded-full text-paper shadow-[0_14px_30px_-12px_rgba(18,55,39,0.9)] ring-4 transition group-active:scale-95",
                  isActive(pathname, "/penjualan/baru")
                    ? "bg-brand-900 ring-gold-300"
                    : "bg-brand-700 ring-cream",
                )}
              >
                <Plus className="h-6 w-6" />
              </span>
              <span
                className={clsx(
                  "text-[11px] leading-none text-brand-800",
                  isActive(pathname, "/penjualan/baru") ? "font-extrabold" : "font-bold",
                )}
              >
                Jual
              </span>
            </Link>
          </div>

          {mobileNav.slice(2).map((item) => (
            <MobileNavItem
              key={item.href}
              item={item}
              active={isMobileActive(pathname, item.href)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({
  item,
  active,
}: {
  item: (typeof mobileNav)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="group relative flex h-full flex-col items-center justify-center gap-0.5"
    >
      {/* Garis penanda di tepi atas menu yang aktif */}
      <span
        aria-hidden
        className={clsx(
          "absolute top-0 h-[3px] rounded-b-full bg-brand-700 transition-all",
          active ? "w-9 opacity-100" : "w-0 opacity-0",
        )}
      />
      <span
        className={clsx(
          "grid h-8 w-14 place-items-center rounded-full transition-colors",
          active
            ? "bg-brand-700 text-paper shadow-[0_6px_14px_-6px_rgba(18,55,39,0.8)]"
            : "text-muted group-active:bg-brand-50",
        )}
      >
        <Icon className={clsx("h-5 w-5", active && "stroke-[2.4]")} />
      </span>
      <span
        className={clsx(
          "text-[11px] leading-none transition-colors",
          active ? "font-extrabold text-brand-800" : "font-semibold text-muted",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
