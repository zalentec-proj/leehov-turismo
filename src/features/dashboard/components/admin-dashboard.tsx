import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Clock3,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Plane,
  Plus,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AdminDashboardData, DashboardActivity, DashboardMetric } from "@/features/dashboard/types";
import { formatDashboardTrend, formatRelativeTime, initials } from "@/features/dashboard/utils";
import { cn } from "@/lib/utils";

const metricStyles = {
  caravans: { icon: Plane, color: "bg-[#EAF2FF] text-[#0878DE]" },
  posts: { icon: FileText, color: "bg-[#E7F8F0] text-[#09A867]" },
  leads: { icon: Users, color: "bg-[#FFF3DF] text-[#F59A00]" },
  newsletter: { icon: Mail, color: "bg-[#F4E9FF] text-[#9444E8]" },
} as const;

const activityStyles: Record<DashboardActivity["kind"], { icon: typeof Plane; color: string }> = {
  caravan: { icon: Plane, color: "bg-[#EAF2FF] text-[#0878DE]" },
  post: { icon: Newspaper, color: "bg-[#FFF3DF] text-[#F59A00]" },
  lead: { icon: MessageSquare, color: "bg-[#E8F8F0] text-[#08A864]" },
  newsletter: { icon: Mail, color: "bg-[#F4E9FF] text-[#9444E8]" },
};

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function sourceLabel(value: string) {
  if (value === "caravan_interest") return "Caravana";
  if (value === "popup") return "Pop-up";
  return "Contato";
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const style = metricStyles[metric.id];
  const Icon = style.icon;
  const trend = formatDashboardTrend(metric.trend);

  return (
    <Card className="min-h-[128px] rounded-[18px] border-leehov-border p-5 shadow-leehov-card sm:p-6">
      <div className="flex items-start gap-4">
        <span className={cn("flex size-[72px] shrink-0 items-center justify-center rounded-2xl", style.color)}>
          <Icon className="size-7" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#3F5677]">{metric.label}</p>
          <p className="mt-1 text-[31px] font-extrabold leading-none tracking-[-0.04em] text-leehov-navy-950">
            {formatMetricValue(metric.value)}
          </p>
          <p className={cn(
            "mt-2 text-xs font-bold sm:text-sm",
            trend.tone === "positive" && "text-[#08A864]",
            trend.tone === "negative" && "text-[#D84A4A]",
            trend.tone === "neutral" && "text-[#71839A]",
          )}>
            {trend.label}
          </p>
        </div>
      </div>
    </Card>
  );
}

function OverviewChart({ timeline: data, metrics }: Pick<AdminDashboardData, "timeline" | "metrics">) {
  const graphWidth = 660;
  const graphHeight = 212;
  const values = data.map((point) => point.value);
  const max = Math.max(...values, 1);
  const points = data.map((point, index) => {
    const x = data.length <= 1 ? 0 : (index / (data.length - 1)) * graphWidth;
    const y = graphHeight - 12 - (point.value / max) * (graphHeight - 30);
    return { ...point, x, y };
  });
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area = `${line} L ${graphWidth},${graphHeight} L 0,${graphHeight} Z`;
  const isEmpty = values.every((value) => value === 0);

  return (
    <Card className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-[-0.025em] text-leehov-navy-950">Visão geral</h3>
          <p className="mt-1 text-sm text-leehov-muted">Leads recebidos nos últimos 30 dias</p>
        </div>
        <span className="rounded-lg border border-leehov-border bg-white px-3 py-2 text-sm font-medium text-[#516784]">Últimos 30 dias</span>
      </div>

      <div className="relative mt-6 min-h-[230px]" aria-label="Gráfico de leads recebidos nos últimos 30 dias" role="img">
        <svg className="h-[230px] w-full overflow-visible" viewBox={`0 0 ${graphWidth} ${graphHeight + 24}`} preserveAspectRatio="none" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = graphHeight - fraction * (graphHeight - 24);
            return <line key={fraction} x1="0" x2={graphWidth} y1={y} y2={y} stroke="#DDEAF5" strokeWidth="1" />;
          })}
          <defs>
            <linearGradient id="dashboard-leads-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0CA8E8" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#0CA8E8" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {!isEmpty ? <path d={area} fill="url(#dashboard-leads-area)" /> : null}
          <path d={line} fill="none" stroke="#0878DE" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.filter((_, index) => index === 0 || index === points.length - 1 || index % 6 === 0).map((point) => (
            <circle key={point.date} cx={point.x} cy={point.y} r="3.75" fill="white" stroke="#0878DE" strokeWidth="2.5" />
          ))}
        </svg>
        {isEmpty ? <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-leehov-muted">Nenhum lead foi recebido neste período. As próximas entradas aparecerão aqui.</p> : null}
      </div>

      <div className="mt-1 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-leehov-border pt-5 sm:grid-cols-4">
        {metrics.map((metric) => {
          const trend = formatDashboardTrend(metric.trend);
          return (
            <div key={metric.id}>
              <p className="text-xs font-medium text-[#617692]">{metric.label}</p>
              <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
                <strong className="text-xl font-extrabold tracking-[-0.03em] text-leehov-navy-950">{metric.trend.current}</strong>
                <span className={cn("text-xs font-bold", trend.tone === "positive" ? "text-[#08A864]" : "text-[#71839A]")}>{metric.trend.percentage === null ? "no período" : `${metric.trend.percentage > 0 ? "+" : ""}${metric.trend.percentage}%`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RecentLeads({ leads, now }: { leads: AdminDashboardData["recentLeads"]; now: Date }) {
  return (
    <Card className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-[-0.025em] text-leehov-navy-950">Leads recentes</h3>
          <p className="mt-1 text-sm text-leehov-muted">Novos contatos recebidos pelo site</p>
        </div>
        <Link href="/admin/leads" className="shrink-0 text-sm font-extrabold text-[#0878DE] hover:text-leehov-blue-500">Ver todos</Link>
      </div>
      <div className="mt-4 divide-y divide-leehov-border">
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center gap-3 py-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E3F0FF] text-xs font-extrabold text-[#0878DE]">{initials(lead.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-leehov-navy-950">{lead.name}</p>
              <p className="truncate text-xs text-[#617692]">{lead.email}</p>
            </div>
            <div className="hidden text-right sm:block">
              <span className="inline-flex rounded-full bg-[#EAF2FF] px-2.5 py-1 text-xs font-bold text-[#0878DE]">{sourceLabel(lead.source)}</span>
              <p className="mt-1 text-xs text-[#71839A]">{formatRelativeTime(lead.createdAt, now)}</p>
            </div>
          </div>
        ))}
        {!leads.length ? <p className="py-10 text-center text-sm text-leehov-muted">Nenhum lead recebido até agora.</p> : null}
      </div>
    </Card>
  );
}

function ContentList({ title, href, items, type, now }: { title: string; href: string; items: AdminDashboardData["recentCaravans"]; type: "caravan" | "post"; now: Date }) {
  const Icon = type === "caravan" ? MapPin : BookOpen;
  return (
    <Card className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-extrabold text-leehov-navy-950">{title}</h3>
        <Link href={href} className="text-sm font-extrabold text-[#0878DE] hover:text-leehov-blue-500">Ver todos</Link>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl py-1.5">
            <span className="w-4 text-center text-sm font-extrabold text-[#647A93]">{index + 1}</span>
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", type === "caravan" ? "bg-[#EAF2FF] text-[#0878DE]" : "bg-[#E8F8F0] text-[#08A864]")}><Icon className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-extrabold leading-5 text-leehov-navy-950">{item.title}</p>
              <p className="mt-0.5 truncate text-xs text-[#617692]">{item.description}</p>
            </div>
            <span className="hidden shrink-0 text-xs text-[#71839A] sm:inline">{formatRelativeTime(item.updatedAt, now)}</span>
          </div>
        ))}
        {!items.length ? <p className="py-8 text-center text-sm text-leehov-muted">Ainda não há itens para mostrar.</p> : null}
      </div>
    </Card>
  );
}

function ActivityList({ activities, now }: { activities: AdminDashboardData["activities"]; now: Date }) {
  return (
    <Card className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-extrabold text-leehov-navy-950">Atividades recentes</h3>
        <span className="text-sm font-extrabold text-[#0878DE]">Atualizado agora</span>
      </div>
      <div className="mt-4 divide-y divide-leehov-border">
        {activities.map((activity) => {
          const style = activityStyles[activity.kind];
          const Icon = style.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3 py-3.5">
              <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", style.color)}><Icon className="size-3.5" /></span>
              <p className="min-w-0 flex-1 text-sm leading-5 text-[#334F6E]">{activity.description}</p>
              <span className="shrink-0 whitespace-nowrap text-xs text-[#71839A]">{formatRelativeTime(activity.occurredAt, now)}</span>
            </div>
          );
        })}
        {!activities.length ? <p className="py-10 text-center text-sm text-leehov-muted">As atualizações de conteúdo e relacionamento aparecerão aqui.</p> : null}
      </div>
    </Card>
  );
}

export function AdminDashboard({ data, profileName }: { data: AdminDashboardData; profileName: string }) {
  const now = new Date(data.generatedAt);
  const profileFirstName = profileName.trim().split(/\s+/)[0] || "Admin";
  const firstName = profileFirstName.includes("@") ? "Admin" : profileFirstName;
  const formattedDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(now);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 border-b border-leehov-border pb-5 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Dashboard</p>
          <h2 className="mt-2 text-[clamp(28px,3vw,36px)] font-extrabold tracking-[-0.045em] text-leehov-navy-950">Olá, {firstName}! <span aria-hidden="true">👋</span></h2>
          <p className="mt-2 text-sm text-[#526983]">Bem-vindo ao painel da Leehov Turismo.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-leehov-border bg-white px-3 py-2 text-sm font-medium text-[#455D79]"><Clock3 className="size-4 text-[#0878DE]" />{formattedDate}</span>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <OverviewChart timeline={data.timeline} metrics={data.metrics} />
        <RecentLeads leads={data.recentLeads} now={now} />
      </section>

      <p className="rounded-xl border border-dashed border-leehov-border bg-white px-4 py-3 text-xs leading-5 text-[#617692]">Visitas, usuários e conversão serão exibidos aqui quando o GA4 estiver configurado com consentimento. Os números desta tela usam somente dados administrativos já registrados no Supabase.</p>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_0.95fr_1.3fr]">
        <ContentList title="Caravanas recentes" href="/admin/caravanas" items={data.recentCaravans} type="caravan" now={now} />
        <ContentList title="Posts recentes" href="/admin/blog" items={data.recentPosts} type="post" now={now} />
        <ActivityList activities={data.activities} now={now} />
      </section>

      <div className="flex flex-wrap gap-3 border-t border-leehov-border pt-5">
        <Link href="/admin/caravanas/novo" className="inline-flex items-center gap-2 rounded-xl bg-[#0878DE] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-leehov-blue-500"><Plus className="size-4" />Nova caravana</Link>
        <Link href="/admin/blog/novo" className="inline-flex items-center gap-2 rounded-xl border border-leehov-border bg-white px-4 py-2.5 text-sm font-extrabold text-[#234968] transition hover:border-[#9DD8F0] hover:text-[#0878DE]">Novo post<ChevronRight className="size-4" /></Link>
        <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-xl border border-leehov-border bg-white px-4 py-2.5 text-sm font-extrabold text-[#234968] transition hover:border-[#9DD8F0] hover:text-[#0878DE]">Gerenciar leads<ChevronRight className="size-4" /></Link>
      </div>
    </div>
  );
}
