import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminNewsletterPage() {
  return (
    <AdminPlaceholderPage
      title="Newsletter"
      description="Inscritos com double opt-in, origem e status de confirmacao."
      items={["Status pending/active", "Confirmacao por e-mail", "Busca", "Metricas"]}
    />
  );
}
