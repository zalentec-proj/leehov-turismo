import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminLeadsPage() {
  return (
    <AdminPlaceholderPage
      title="Leads"
      description="Leads internos protegidos por RLS, com status, origem e acao rapida para WhatsApp."
      items={["Tabela de leads", "Filtros por origem", "Alteracao de status", "Acao para WhatsApp"]}
    />
  );
}
