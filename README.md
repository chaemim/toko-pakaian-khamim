# Lapak — Pencatatan Penjualan Toko Pakaian

Aplikasi web untuk mencatat penjualan pakaian di lapak/toko: harga beli, harga jual,
harga nego, dan daftar harga per ukuran (mis. seragam sekolah S/M/L).

## Fitur

- Login dengan sesi 30 hari (cookie httpOnly, diperpanjang otomatis).
- Setup akun pemilik saat pertama kali dibuka.
- Produk + harga beli/harga jual per ukuran.
- Catat penjualan beberapa barang sekaligus, harga deal/nego, diskon, pembayaran.
- Laba dihitung otomatis dari harga beli dan harga deal.
- Daftar barang terjual per periode (barang, ukuran, harga, laba) terpisah dari riwayat transaksi.
- Dashboard omzet/laba, laporan per periode, produk terlaris, ekspor CSV.
- Struk dan daftar harga siap cetak (A4).
- Kelola pengguna (pemilik/staf), ganti password, profil toko.
- Tampilan responsif (mobile-friendly) dengan Tailwind CSS.

## Mode offline (PWA)

Aplikasi bisa di-install ke layar utama HP dan tetap dipakai saat sinyal tidak stabil.

- **Install:** buka situs di Chrome (Android) → menu → *Install app* / *Tambahkan ke layar utama*.
- **Katalog produk** (nama, ukuran, harga) disalin ke perangkat setiap app dibuka saat online.
- **Catat penjualan** selalu disimpan dulu di perangkat (IndexedDB), lalu langsung dikirim. Kalau sinyal bermasalah, transaksi masuk antrean dan dikirim otomatis saat koneksi kembali. Tiap transaksi punya ID unik (`sales.client_id`), jadi pengiriman ulang tidak membuat data dobel.
- **Nomor invoice** dibuat server saat transaksi diterima; laba dan modal dihitung ulang di server dari harga di database.
- Saat app dibuka tanpa koneksi dan halaman belum tersimpan, yang tampil adalah halaman `/offline` (kasir + daftar antrean).
- Dashboard, laporan, dan kelola produk/pengguna tetap butuh internet.
- Service worker hanya aktif di build production (`npm run build && npm start` atau di Vercel), bukan di `npm run dev`.

Setelah update ini jalankan sekali `npm run db:push` untuk menambah kolom `client_id`.

## Teknologi

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM ·
PostgreSQL/Neon · `jose` (JWT) · `bcryptjs`.

## Menjalankan di komputer sendiri

Prasyarat: Node.js 20+ dan PostgreSQL (atau database Neon).

1. Install dependency:

   ```bash
   npm install
   ```

2. Siapkan environment. Salin `.env.example` menjadi `.env.local`, lalu isi:

   ```env
   DATABASE_URL=postgresql://user:password@127.0.0.1:5432/lapak_dev
   AUTH_SECRET=string-acak-panjang
   ```

   Buat `AUTH_SECRET` dengan:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Buat tabel di database:

   ```bash
   npm run db:push
   ```

   Untuk database Neon, gunakan connection string dengan host `-pooler` dan
   `?sslmode=require`.

4. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000/setup](http://localhost:3000/setup), isi nama toko,
   nama pemilik, username, dan password. Setelah itu Anda diarahkan ke dashboard.

Proyek ini sudah memiliki `.env.local` yang mengarah ke PostgreSQL lokal
(`lapak_dev`). Akun yang pernah dibuat di database tersebut tetap tersimpan.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Jalankan server development |
| `npm run build` | Build production |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | Cek ESLint |
| `npm run typecheck` | Cek TypeScript |
| `npm run db:push` | Terapkan skema ke database |
| `npm run db:generate` | Buat file migrasi Drizzle |
| `npm run db:studio` | Buka Drizzle Studio |

## Deploy ke Vercel + Neon (gratis)

1. Buat project di [Neon](https://neon.tech), lalu salin **pooled connection string**
   (host mengandung `-pooler`).
2. Di komputer, isi sementara `DATABASE_URL` Neon di `.env.local`, lalu jalankan:

   ```bash
   npm run db:push
   ```

   Ini membuat tabel di database Neon.
3. Unggah project ke GitHub, lalu import repositori tersebut di
   [Vercel](https://vercel.com/new).
4. Tambahkan Environment Variables di Vercel:
   - `DATABASE_URL` → connection string Neon (pooled)
   - `AUTH_SECRET` → string acak yang sama/baru (minimal 16 karakter)
5. Deploy. Setelah selesai, buka `https://nama-project.vercel.app/setup` untuk
   membuat akun pemilik pertama.
6. Ganti password pemilik lewat menu **Pengaturan** setelah login.

Catatan:

- Jangan commit `.env.local`. File itu sudah masuk `.gitignore`.
- `AUTH_SECRET` harus tetap sama di semua environment; menggantinya akan membuat
  semua pengguna logout.
- Gunakan connection string pooled Neon agar aman untuk serverless Vercel.
- Untuk database produksi, sebaiknya buat backup/ekspor CSV secara berkala.
