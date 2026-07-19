import { CircleCheck, Clock3, Inbox, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdminLeadsTable } from "@/features/leads/components/admin-leads-table";
import { getAdminLeads, getLeadMetrics } from "@/features/leads/queries";

export default async function AdminLeadsPage() {
  const [leads, metrics] = await Promise.all([getAdminLeads(), getLeadMetrics()]);
  const cards = [
    { label: "Total de leads", value: metrics.total, icon: MessageSquare },
    { label: "Novos", value: metrics.new, icon: Inbox },
    { label: "Em atendimento", value: metrics.inProgress, icon: Clock3 },
    { label: "Convertidos", value: metrics.converted, icon: CircleCheck },
  ];

  return <><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Relacionamento</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Leads</h2><p className="mt-3 text-leehov-muted">Acompanhe contatos e interesses em caravanas sem excluir o histórico.</p></div><div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((item) => <Card key={item.label} className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card"><item.icon className="size-6 text-leehov-blue-500" /><p className="mt-5 text-3xl font-extrabold text-leehov-navy-950">{item.value}</p><p className="mt-1 text-sm text-leehov-muted">{item.label}</p></Card>)}</div><AdminLeadsTable data={leads} /></>;
}
