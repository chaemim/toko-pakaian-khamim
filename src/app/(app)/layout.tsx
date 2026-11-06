import { requireUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/queries";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Jalankan bersamaan: dua query terpisah tidak perlu saling menunggu.
  const [user, store] = await Promise.all([requireUser(), getStoreSettings()]);

  return (
    <AppShell
      user={{ name: user.name, username: user.username, role: user.role }}
      storeName={store.storeName}
    >
      {children}
    </AppShell>
  );
}
