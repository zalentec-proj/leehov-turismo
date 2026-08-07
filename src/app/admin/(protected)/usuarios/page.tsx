import { AdminUsersManager } from "@/features/auth/components/admin-users-manager";
import { permissionGroups } from "@/features/auth/permissions";
import { getAdminUsers, getCurrentProfile, getEditorDefaultPermissions } from "@/features/auth/queries";

export default async function AdminUsersPage() {
  const [users, editorDefaults, currentProfile] = await Promise.all([
    getAdminUsers(),
    getEditorDefaultPermissions(),
    getCurrentProfile(),
  ]);
  return <AdminUsersManager users={users} editorDefaults={editorDefaults} groups={permissionGroups} currentUserId={currentProfile?.id ?? ""} />;
}
