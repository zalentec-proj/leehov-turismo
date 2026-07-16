import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function NewCaravanPage() {
  return (
    <AdminPlaceholderPage
      title="Nova caravana"
      description="Formulario em abas sera conectado ao schema de caravanas, Storage e Server Actions."
      items={["Informacoes gerais", "Imagens", "Saidas", "Roteiro", "SEO", "Publicacao"]}
    />
  );
}
