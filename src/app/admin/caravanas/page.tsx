import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminCaravansPage() {
  return (
    <AdminPlaceholderPage
      title="Caravanas"
      description="CRUD de caravanas com abas para informacoes, imagens, saidas, roteiro, grupo, SEO e publicacao."
      items={["Listagem com busca e filtros", "Formulario em abas", "Publicacao e destaques", "Upload via Storage"]}
    />
  );
}
