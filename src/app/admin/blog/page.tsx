import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminBlogPage() {
  return (
    <AdminPlaceholderPage
      title="Blog"
      description="Gestao editorial para posts, categorias, destaque no blog e relacao com caravanas."
      items={["Listagem de posts", "Editor com SEO", "Categorias", "Publicacao controlada"]}
    />
  );
}
