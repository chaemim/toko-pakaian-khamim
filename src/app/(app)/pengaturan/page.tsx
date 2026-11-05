import { asc } from "drizzle-orm";
import { Info, LogOut } from "lucide-react";

import { db } from "@/db";
import { users } from "@/db/schema";
import { logoutAction } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/queries";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import {
  PasswordForm,
  ProfileForm,
  StoreForm,
  UsersCard,
} from "@/components/settings/settings-forms";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const user = await requireUser();
  const store = await getStoreSettings();
  const params = await searchParams;

  const isOwner = user.role === "owner";
  const memberRows = isOwner
    ? await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(asc(users.createdAt))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akun & toko"
        title="Pengaturan"
        description="Kelola profil, keamanan akun, informasi toko, dan pengguna yang bisa mengakses aplikasi."
      />

      {params.status === "pengguna-dihapus" ? (
        <Alert tone="success">Akun pengguna berhasil dihapus.</Alert>
      ) : null}
      {params.error ? <Alert tone="error">{params.error}</Alert> : null}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <ProfileForm
            user={{ name: user.name, username: user.username, role: user.role }}
          />
          <PasswordForm />

          <Card>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-bold text-ink">Sesi perangkat</p>
                <p className="mt-0.5 max-w-sm text-[11px] leading-relaxed text-muted">
                  Anda tetap masuk selama 30 hari dan sesi diperpanjang otomatis
                  saat aplikasi dibuka. Keluar hanya dari perangkat ini.
                </p>
              </div>
              <form action={logoutAction} className="shrink-0">
                <button
                  type="submit"
                  className={buttonClasses({
                    variant: "secondary",
                    className:
                      "w-full border-rust-100 text-rust-600 hover:border-rust-200 hover:bg-rust-50 sm:w-auto",
                  })}
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {isOwner ? (
            <>
              <StoreForm
                store={{
                  storeName: store.storeName,
                  tagline: store.tagline,
                  phone: store.phone,
                  address: store.address,
                  receiptNote: store.receiptNote,
                }}
              />
              <UsersCard
                currentUserId={user.id}
                members={memberRows.map((member) => ({
                  id: member.id,
                  name: member.name,
                  username: member.username,
                  role: member.role,
                  joinedLabel: formatDate(
                    member.createdAt.toISOString().slice(0, 10),
                  ),
                }))}
              />
            </>
          ) : (
            <Card>
              <div className="flex gap-3 p-5 text-xs leading-relaxed text-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Informasi toko dan pengguna hanya dapat diubah oleh akun
                pemilik. Hubungi pemilik toko jika ada perubahan.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
