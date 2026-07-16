import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminMediaPage() {
  return (
    <AdminPlaceholderPage
      title="Mídia"
      description="Biblioteca de imagens e arquivos usando Supabase Storage apenas para usuarios autenticados."
      items={["Upload autenticado", "Alt text", "Pastas", "Exclusao controlada"]}
    />
  );
}
