import { AdminCaravansTable } from "@/features/caravans/components/admin-caravans-table";
import { CategoryManager } from "@/features/caravans/components/category-manager";
import { getAdminCaravans, getCaravanCategories } from "@/features/caravans/queries";
import { requireActiveProfile } from "@/features/auth/queries";

export default async function AdminCaravansPage() {
  const [profile, caravans, categories] = await Promise.all([requireActiveProfile(), getAdminCaravans(), getCaravanCategories()]);
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Conteúdo</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Caravanas</h2><p className="mb-8 mt-3 text-sm leading-7 text-leehov-muted">Gerencie roteiros, saídas, imagens, publicação e destaques sem excluir definitivamente os registros.</p>{profile.role === "admin" ? <CategoryManager categories={categories} /> : null}<AdminCaravansTable data={caravans} /></div>;
}
