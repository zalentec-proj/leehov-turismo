import { CircleCheck, Clock3, Mail, MailX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdminNewsletterTable } from "@/features/newsletter/components/admin-newsletter-table";
import { getAdminNewsletterSubscribers, getEmailLogs, getNewsletterMetrics } from "@/features/newsletter/queries";

export default async function AdminNewsletterPage() {
  const [subscribers, logs, metrics] = await Promise.all([getAdminNewsletterSubscribers(), getEmailLogs(), getNewsletterMetrics()]);
  const cards = [
    { label: "Total de cadastros", value: metrics.total, icon: Mail },
    { label: "Pendentes", value: metrics.pending, icon: Clock3 },
    { label: "Ativos", value: metrics.active, icon: CircleCheck },
    { label: "Cancelados", value: metrics.unsubscribed, icon: MailX },
  ];
  return <><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Comunicação</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Newsletter</h2><p className="mt-3 text-leehov-muted">Inscrições com confirmação por e-mail, origem e histórico de tentativas transacionais.</p></div><div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((item) => <Card key={item.label} className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card"><item.icon className="size-6 text-leehov-blue-500" /><p className="mt-5 text-3xl font-extrabold text-leehov-navy-950">{item.value}</p><p className="mt-1 text-sm text-leehov-muted">{item.label}</p></Card>)}</div><AdminNewsletterTable subscribers={subscribers} logs={logs} /></>;
}
