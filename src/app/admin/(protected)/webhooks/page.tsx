import { Activity, Cable, CheckCircle2, XCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { requireAdminProfile } from "@/features/auth/queries";
import { AdminWebhooks } from "@/features/webhooks/components/admin-webhooks";
import { getAdminWebhooks, getWebhookDeliveryLogs, getWebhookMetrics } from "@/features/webhooks/queries";

export default async function AdminWebhooksPage() {
  await requireAdminProfile();
  const [webhooks, logs, metrics] = await Promise.all([getAdminWebhooks(), getWebhookDeliveryLogs(), getWebhookMetrics()]);
  const cards = [
    { label: "Webhooks ativos", value: `${metrics.active}/${metrics.total}`, icon: Cable },
    { label: "Entregas pendentes", value: metrics.pendingDeliveries, icon: Activity },
    { label: "Entregas enviadas", value: metrics.sentDeliveries, icon: CheckCircle2 },
    { label: "Falhas", value: metrics.failedDeliveries, icon: XCircle },
  ];
  return <><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Integrações</p><h2 className="mt-3 flex items-center gap-3 text-3xl font-extrabold text-leehov-navy-950"><Cable className="size-8 text-leehov-blue-500" />Webhooks</h2><p className="mt-3 text-leehov-muted">Eventos assinados, histórico de entregas e reenvio manual sem expor dados ou chaves.</p></div><div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((item) => <Card key={item.label} className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card"><item.icon className="size-6 text-leehov-blue-500" /><p className="mt-5 text-3xl font-extrabold text-leehov-navy-950">{item.value}</p><p className="mt-1 text-sm text-leehov-muted">{item.label}</p></Card>)}</div><AdminWebhooks webhooks={webhooks} logs={logs} /></>;
}
