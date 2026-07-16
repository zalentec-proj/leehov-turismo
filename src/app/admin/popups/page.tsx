import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminPopupsPage() {
  return (
    <AdminPlaceholderPage
      title="Pop-ups"
      description="Pop-up principal do MVP com frequencia controlada e CTA para campanha, newsletter, WhatsApp ou caravana."
      items={["Criar pop-up", "Ativar/desativar", "Frequencia", "CTA configuravel"]}
    />
  );
}
