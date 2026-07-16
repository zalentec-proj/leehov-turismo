import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminUsersPage() {
  return (
    <AdminPlaceholderPage
      title="Usuários"
      description="Perfis administrativos vinculados ao Supabase Auth, com papeis admin e editor."
      items={["Listar usuarios", "Papel admin/editor", "Ativar/desativar", "Permissoes"]}
    />
  );
}
