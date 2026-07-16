import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function EditBlogPostPage() {
  return (
    <AdminPlaceholderPage
      title="Editar post"
      description="Edicao de post existente com publicacao controlada e evento blog_post.published."
      items={["Conteudo", "Categoria", "Caravana relacionada", "Imagem", "SEO"]}
    />
  );
}
