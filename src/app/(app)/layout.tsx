import { requireUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/queries";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const store = await getStoreSettings();

  return (
    <AppShell
      user={{ name: user.name, username: user.username, role: user.role }}
      storeName={store.storeName}
    >
      {children}
    </AppShell>
  );
}
