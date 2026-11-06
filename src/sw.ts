/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Aturan bawaan Serwist untuk halaman memakai NetworkFirst TANPA batas waktu:
// saat sinyal lemah, pindah halaman menunggu sampai koneksi benar-benar gagal.
// Di sini dibatasi 3 detik, lewat dari itu langsung pakai salinan di perangkat.
const NAVIGATION_TIMEOUT = 3;

function pageStrategy(cacheName: string) {
  return new NetworkFirst({
    cacheName,
    networkTimeoutSeconds: NAVIGATION_TIMEOUT,
    plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
  });
}

const pageRules = [
  {
    matcher: ({
      request,
      url: { pathname },
      sameOrigin,
    }: {
      request: Request;
      url: URL;
      sameOrigin: boolean;
    }) =>
      sameOrigin &&
      !pathname.startsWith("/api/") &&
      request.headers.get("RSC") === "1" &&
      request.headers.get("Next-Router-Prefetch") === "1",
    handler: pageStrategy("pages-rsc-prefetch"),
  },
  {
    matcher: ({
      request,
      url: { pathname },
      sameOrigin,
    }: {
      request: Request;
      url: URL;
      sameOrigin: boolean;
    }) =>
      sameOrigin &&
      !pathname.startsWith("/api/") &&
      request.headers.get("RSC") === "1",
    handler: pageStrategy("pages-rsc"),
  },
  {
    matcher: ({
      request,
      url: { pathname },
      sameOrigin,
    }: {
      request: Request;
      url: URL;
      sameOrigin: boolean;
    }) =>
      sameOrigin &&
      !pathname.startsWith("/api/") &&
      request.destination === "document",
    handler: pageStrategy("pages"),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Aturan kita diperiksa lebih dulu, sisanya memakai bawaan.
  runtimeCaching: [...pageRules, ...defaultCache],
  fallbacks: {
    entries: [
      {
        // Halaman yang gagal dimuat saat offline -> kasir offline.
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
