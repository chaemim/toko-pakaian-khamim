import { redirect } from "next/navigation";

import { hasAnyUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { DbSetupNotice } from "@/components/auth/db-setup-notice";
import { SetupForm } from "@/components/auth/setup-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Persiapan awal",
};

export default async function SetupPage() {
  let hasUsers = false;
  let databaseError = false;

  try {
    hasUsers = await hasAnyUser();
  } catch {
    databaseError = true;
  }

  if (hasUsers) redirect("/login");

  return (
    <AuthShell>
      {databaseError ? <DbSetupNotice /> : <SetupForm />}
    </AuthShell>
  );
}
