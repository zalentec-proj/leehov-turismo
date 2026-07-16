import { Plane, FileText, MessageSquare, Mail } from "lucide-react";
import { AdminShell } from "@/components/leehov/admin/admin-shell";
import { Card } from "@/components/ui/card";

const metrics = [
  { label: "Caravanas ativas", value: "0", icon: Plane },
  { label: "Posts publicados", value: "0", icon: FileText },
  { label: "Leads recebidos", value: "0", icon: MessageSquare },
  { label: "Inscritos newsletter", value: "0", icon: Mail },
];

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">
          Dashboard
        </p>
        <h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">
          Visão geral
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card">
            <metric.icon className="mb-6 size-8 text-leehov-blue-500" />
            <p className="text-3xl font-extrabold text-leehov-navy-950">
              {metric.value}
            </p>
            <p className="mt-2 text-sm text-leehov-muted">{metric.label}</p>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
