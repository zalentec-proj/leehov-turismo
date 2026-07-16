import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminWebhooksPage() {
  return (
    <AdminPlaceholderPage
      title="Webhooks"
      description="Configuracao server-side de eventos, historico de entregas, teste e reenvio de falhas."
      items={["Eventos do MVP", "URL e chave de validacao", "Logs", "Reenvio manual"]}
    />
  );
}
