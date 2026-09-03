import { ChartNoAxesCombined } from "lucide-react";

import { Card } from "@/components/ui/card";
import { requirePermission } from "@/features/auth/permissions";
import { AdminMetaConversions } from "@/features/meta-conversions/components/admin-meta-conversions";
import { getMetaConversionsDashboard } from "@/features/meta-conversions/queries";

export default async function MetaConversionsPage() {
  await requirePermission("meta_conversions.view");
  const { settings, campaigns, events, metrics } = await getMetaConversionsDashboard();
  const cards = [["Enviados", metrics.sent], ["Ignorados", metrics.ignored], ["Falhas", metrics.failed], ["Pendentes", metrics.pending + metrics.reviewRequired]];
  return <><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Integrações</p><h2 className="mt-3 flex items-center gap-3 text-3xl font-extrabold text-leehov-navy-950"><ChartNoAxesCombined className="size-8 text-leehov-blue-500" />Conversões Meta</h2><p className="mt-3 text-leehov-muted">Vendas qualificadas do RD Station enviadas como Purchase para o Pixel.</p></div><div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <Card key={String(label)} className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card"><p className="text-3xl font-extrabold text-leehov-navy-950">{value}</p><p className="mt-1 text-sm text-leehov-muted">{label}</p></Card>)}</div><AdminMetaConversions settings={settings} campaigns={campaigns} events={events} /></>;
}
