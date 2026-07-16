import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function NewBlogPostPage() {
  return (
    <AdminPlaceholderPage
      title="Novo post"
      description="Editor preparado para conteudo, imagem principal, relacao com caravanas e SEO."
      items={["Titulo e slug", "Resumo", "Conteudo", "Imagem", "SEO", "Publicacao"]}
    />
  );
}
