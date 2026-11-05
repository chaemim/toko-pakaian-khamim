import { redirect } from "next/navigation";

import { getCurrentUser, hasAnyUser, safeNextPath } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { DbSetupNotice } from "@/components/auth/db-setup-notice";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Masuk",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  let user = null;
  let databaseError = false;
  try {
    user = await getCurrentUser();
  } catch {
    databaseError = true;
  }

  if (user) redirect("/dashboard");

  let showSetup = false;
  if (!databaseError) {
    try {
      showSetup = !(await hasAnyUser());
    } catch {
      databaseError = true;
    }
  }

  return (
    <AuthShell>
      {databaseError ? (
        <DbSetupNotice />
      ) : (
        <LoginForm
          next={safeNextPath(params.next)}
          showSetup={showSetup}
        />
      )}
    </AuthShell>
  );
}
