"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Check,
  Loader2,
  LockKeyhole,
  Store,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  changePasswordAction,
  createUserAction,
  updateProfileAction,
  updateStoreAction,
} from "@/actions/settings";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/field";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteUserAction } from "@/actions/settings";
import { initials } from "@/lib/format";
import { EMPTY_ACTION_STATE, firstError } from "@/lib/types";

function SubmitRow({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClasses({ className: "w-full sm:w-auto" })}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}

export function ProfileForm({
  user,
}: {
  user: { name: string; username: string; role: string };
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <Card>
      <CardHeader
        title="Profil Anda"
        description="Nama ini tampil di aplikasi dan struk transaksi."
        action={
          <Badge tone={user.role === "owner" ? "gold" : "muted"}>
            {user.role === "owner" ? "Pemilik" : "Staf"}
          </Badge>
        }
      />
      <form action={formAction} className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-sm font-bold text-paper">
            {initials(user.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-ink">{user.name}</p>
            <p className="text-xs text-muted">@{user.username}</p>
          </div>
        </div>

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}

        <div>
          <Label htmlFor="profile-name">Nama lengkap</Label>
          <Input
            id="profile-name"
            name="name"
            defaultValue={user.name}
            required
            minLength={2}
            maxLength={60}
          />
          {firstError(state, "name") ? (
            <p className="mt-1.5 text-xs text-rust-600">
              {firstError(state, "name")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="profile-username">Username</Label>
          <Input
            id="profile-username"
            value={user.username}
            disabled
            readOnly
          />
          <p className="mt-1.5 text-[10px] text-muted">
            Username tidak dapat diubah.
          </p>
        </div>

        <SubmitRow
          pending={pending}
          label="Simpan nama"
          pendingLabel="Menyimpan…"
        />
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <Card>
      <CardHeader
        title="Keamanan"
        description="Ganti password secara berkala agar akun tetap aman."
        action={<LockKeyhole className="h-4 w-4 text-muted" />}
      />
      <form action={formAction} className="space-y-4 p-4 sm:p-5">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}

        <div>
          <Label htmlFor="currentPassword">Password saat ini</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
          {firstError(state, "currentPassword") ? (
            <p className="mt-1.5 text-xs text-rust-600">
              {firstError(state, "currentPassword")}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="newPassword">Password baru</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
            {firstError(state, "newPassword") ? (
              <p className="mt-1.5 text-xs text-rust-600">
                {firstError(state, "newPassword")}
              </p>
            ) : (
              <p className="mt-1.5 text-[10px] text-muted">Minimal 6 karakter.</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Ulangi password baru</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
            {firstError(state, "confirmPassword") ? (
              <p className="mt-1.5 text-xs text-rust-600">
                {firstError(state, "confirmPassword")}
              </p>
            ) : null}
          </div>
        </div>

        <SubmitRow
          pending={pending}
          label="Ganti password"
          pendingLabel="Menyimpan…"
        />
      </form>
    </Card>
  );
}

export function StoreForm({
  store,
}: {
  store: {
    storeName: string;
    tagline: string | null;
    phone: string | null;
    address: string | null;
    receiptNote: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateStoreAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <Card>
      <CardHeader
        title="Informasi toko"
        description="Tampil di struk, daftar harga, dan menu aplikasi."
        action={<Store className="h-4 w-4 text-muted" />}
      />
      <form action={formAction} className="space-y-4 p-4 sm:p-5">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}

        <div>
          <Label htmlFor="storeName">Nama toko</Label>
          <Input
            id="storeName"
            name="storeName"
            defaultValue={store.storeName}
            required
            minLength={2}
            maxLength={60}
          />
          {firstError(state, "storeName") ? (
            <p className="mt-1.5 text-xs text-rust-600">
              {firstError(state, "storeName")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="tagline">Tagline (opsional)</Label>
          <Input
            id="tagline"
            name="tagline"
            defaultValue={store.tagline ?? ""}
            maxLength={100}
            placeholder="Contoh: Pakaian & seragam sekolah"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Nomor telepon</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={store.phone ?? ""}
              maxLength={30}
              placeholder="08xx…"
            />
          </div>
          <div>
            <Label htmlFor="address">Alamat / lokasi lapak</Label>
            <Input
              id="address"
              name="address"
              defaultValue={store.address ?? ""}
              maxLength={160}
              placeholder="Blok A No. 12"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="receiptNote">Catatan di struk</Label>
          <Textarea
            id="receiptNote"
            name="receiptNote"
            defaultValue={store.receiptNote ?? ""}
            maxLength={200}
            placeholder="Contoh: Terima kasih sudah berbelanja."
            className="min-h-16"
          />
        </div>

        <SubmitRow
          pending={pending}
          label="Simpan informasi toko"
          pendingLabel="Menyimpan…"
        />
      </form>
    </Card>
  );
}

export type StoreMember = {
  id: string;
  name: string;
  username: string;
  role: string;
  joinedLabel: string;
};

export function UsersCard({
  members,
  currentUserId,
}: {
  members: StoreMember[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    EMPTY_ACTION_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <Card>
      <CardHeader
        title="Pengguna toko"
        description="Tambahkan akun untuk keluarga atau pegawai yang membantu."
        action={<UsersRound className="h-4 w-4 text-muted" />}
      />
      <div className="divide-y divide-line/70">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-3 sm:px-5"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-[11px] font-bold text-brand-800">
              {initials(member.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-ink">
                  {member.name}
                </p>
                {member.id === currentUserId ? (
                  <Badge tone="muted">Anda</Badge>
                ) : null}
              </div>
              <p className="text-[10px] text-muted">
                @{member.username} · bergabung {member.joinedLabel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={member.role === "owner" ? "gold" : "brand"}>
                {member.role === "owner" ? "Pemilik" : "Staf"}
              </Badge>
              {member.id !== currentUserId ? (
                <ConfirmForm
                  action={deleteUserAction}
                  confirmMessage={`Hapus akun ${member.name}? Akun ini tidak akan bisa masuk lagi.`}
                >
                  <input type="hidden" name="id" value={member.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-2 py-1 text-[10px] font-semibold text-muted transition hover:bg-rust-50 hover:text-rust-600"
                  >
                    Hapus
                  </button>
                </ConfirmForm>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <details className="group border-t border-line">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50/50 sm:px-5">
          <UserPlus className="h-4 w-4" />
          Tambah pengguna
          <span className="ml-auto text-[10px] font-medium text-muted group-open:hidden">
            Buka
          </span>
        </summary>
        <form
          ref={formRef}
          action={formAction}
          className="space-y-3 border-t border-line bg-cream/30 p-4 sm:p-5"
        >
          {state.error ? <Alert tone="error">{state.error}</Alert> : null}
          {state.success ? <Alert tone="success">{state.success}</Alert> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-user-name">Nama</Label>
              <Input
                id="new-user-name"
                name="name"
                required
                minLength={2}
                maxLength={60}
                placeholder="Nama pengguna"
              />
              {firstError(state, "name") ? (
                <p className="mt-1 text-xs text-rust-600">
                  {firstError(state, "name")}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="new-user-username">Username</Label>
              <Input
                id="new-user-username"
                name="username"
                required
                autoCapitalize="none"
                spellCheck={false}
                placeholder="huruf kecil"
              />
              {firstError(state, "username") ? (
                <p className="mt-1 text-xs text-rust-600">
                  {firstError(state, "username")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-user-password">Password awal</Label>
              <Input
                id="new-user-password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Minimal 6 karakter"
              />
              {firstError(state, "password") ? (
                <p className="mt-1 text-xs text-rust-600">
                  {firstError(state, "password")}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="new-user-role">Peran</Label>
              <Select id="new-user-role" name="role" defaultValue="staff">
                <option value="staff">Staf — catat penjualan & produk</option>
                <option value="owner">Pemilik — akses penuh</option>
              </Select>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className={buttonClasses({ size: "sm" })}
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Membuat akun…
              </>
            ) : (
              <>
                <UserRound className="h-3.5 w-3.5" />
                Buat akun
              </>
            )}
          </button>
        </form>
      </details>
    </Card>
  );
}
