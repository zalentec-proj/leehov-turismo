import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholderPage
      title="Configurações"
      description="Contato, WhatsApp, SEO global, scripts, e-mails e integracoes salvos em site_settings."
      items={["Contato", "WhatsApp", "SEO global", "Analytics/GTM/Pixel"]}
    />
  );
}
