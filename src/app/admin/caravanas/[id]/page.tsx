import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function EditCaravanPage() {
  return (
    <AdminPlaceholderPage
      title="Editar caravana"
      description="Edicao estruturada para caravanas existentes, com disparo futuro de eventos caravan.updated e caravan.published."
      items={["Dados principais", "Roteiro dia a dia", "Inclusos", "Destaques", "Historico"]}
    />
  );
}
