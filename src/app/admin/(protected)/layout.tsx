import type { ReactNode } from "react";
import { AdminShell } from "@/components/leehov/admin/admin-shell";
import { requireActiveProfile } from "@/features/auth/queries";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireActiveProfile();
  return <AdminShell profile={profile}>{children}</AdminShell>;
}
