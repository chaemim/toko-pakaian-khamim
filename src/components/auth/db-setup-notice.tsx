import { Alert } from "@/components/ui/alert";

export function DbSetupNotice() {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rust-500">
        Database belum siap
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.01em] text-ink">
        Tinggal satu langkah lagi
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Aplikasi belum bisa terhubung ke database. Periksa dua hal berikut,
        lalu muat ulang halaman ini.
      </p>

      <Alert tone="error" className="mt-6">
        Pastikan <strong>DATABASE_URL</strong> dan <strong>AUTH_SECRET</strong>{" "}
        sudah diisi.
      </Alert>

      <ol className="mt-6 space-y-4 text-sm text-muted">
        <li className="rounded-xl border border-line bg-paper p-4">
          <p className="font-semibold text-ink">1. Isi file .env.local</p>
          <p className="mt-1 text-xs leading-relaxed">
            Salin <code className="rounded bg-cream px-1">.env.example</code>{" "}
            menjadi <code className="rounded bg-cream px-1">.env.local</code>,
            lalu tempel connection string Neon.
          </p>
        </li>
        <li className="rounded-xl border border-line bg-paper p-4">
          <p className="font-semibold text-ink">2. Buat tabel database</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-ink px-3 py-2 text-xs text-paper">
            npm run db:push
          </pre>
        </li>
        <li className="rounded-xl border border-line bg-paper p-4">
          <p className="font-semibold text-ink">3. Muat ulang halaman</p>
          <p className="mt-1 text-xs leading-relaxed">
            Setelah tabel dibuat, kembali ke halaman ini untuk membuat akun
            pemilik.
          </p>
        </li>
      </ol>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Panduan lengkap Neon + Vercel ada di file{" "}
        <code className="rounded bg-cream px-1">README.md</code>.
      </p>
    </div>
  );
}
