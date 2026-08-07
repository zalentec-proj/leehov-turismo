import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { getAdminDashboardData } from "@/features/dashboard/queries";
import { requirePermission } from "@/features/auth/permissions";

export default async function AdminDashboardPage() {
  const [access, data] = await Promise.all([
    requirePermission("dashboard.view"),
    getAdminDashboardData(),
  ]);

  return <AdminDashboard data={data} profileName={access.profile.name || access.profile.email} />;
}
