import type { ReactNode } from "react";
import { AdminShell } from "@/components/leehov/admin/admin-shell";
import { requireActiveProfile } from "@/features/auth/queries";
import { getEffectivePermissions } from "@/features/auth/permissions";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireActiveProfile();
  const permissions = await getEffectivePermissions(profile.id, profile.role, profile.active);
  return <AdminShell profile={profile} permissions={permissions}>{children}</AdminShell>;
}
