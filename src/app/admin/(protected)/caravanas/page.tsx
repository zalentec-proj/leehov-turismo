import { AdminCaravansTable } from "@/features/caravans/components/admin-caravans-table";
import { CategoryManager } from "@/features/caravans/components/category-manager";
import { getAdminCaravans, getCaravanCategories } from "@/features/caravans/queries";
import { requirePermission } from "@/features/auth/permissions";

export default async function AdminCaravansPage() {
  const [access, caravans, categories] = await Promise.all([requirePermission("caravans.view"), getAdminCaravans(), getCaravanCategories()]);
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Conteúdo</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Caravanas</h2><p className="mb-8 mt-3 text-sm leading-7 text-leehov-muted">Gerencie roteiros, saídas, imagens, publicação e destaques sem excluir definitivamente os registros.</p>{access.permissions.includes("caravans.manage_categories") ? <CategoryManager categories={categories} /> : null}<AdminCaravansTable data={caravans} canCreate={access.permissions.includes("caravans.create")} canUpdate={access.permissions.includes("caravans.update")} canPublish={access.permissions.includes("caravans.publish")} /></div>;
}
