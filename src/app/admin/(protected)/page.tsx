import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { getAdminDashboardData } from "@/features/dashboard/queries";
import { requireActiveProfile } from "@/features/auth/queries";

export default async function AdminDashboardPage() {
  const [profile, data] = await Promise.all([
    requireActiveProfile(),
    getAdminDashboardData(),
  ]);

  return <AdminDashboard data={data} profileName={profile.name || profile.email} />;
}
