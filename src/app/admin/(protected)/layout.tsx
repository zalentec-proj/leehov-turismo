import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/leehov/admin/admin-shell";
import { requireActiveProfile } from "@/features/auth/queries";
import { getEffectivePermissions } from "@/features/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireActiveProfile();
  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect("/admin/mfa/verificar");
  const permissions = await getEffectivePermissions(profile.id, profile.role, profile.active);
  return <AdminShell profile={profile} permissions={permissions}>{children}</AdminShell>;
}
