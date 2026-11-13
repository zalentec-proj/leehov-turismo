import Link from "next/link";
import { ArrowUpRight, ChartNoAxesCombined, CircleDollarSign, Eye, MessageCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { channelLabels, type ClassifiedTouch } from "../attribution";
import { stageLabels } from "../commercial";
import { localDay, type ReportFilters, type ReportLead, type buildReport } from "../report";

type Report = ReturnType<typeof buildReport>;
type Lookup = Map<string, string>;
const number = new Intl.NumberFormat("pt-BR");
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
export const money = (minor: number, currency: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(minor / 100);
export const dateLabel = (day: string) => day.split("-").reverse().join("/");
const dateOnly = (day: string) => dateLabel(day).slice(0,5);
const evidenceLabels = { observed: "Observada no site", reported: "Informada pela equipe", legacy: "UTMs anteriores", unknown: "Desconhecida" };
const sourceLabels: Record<string, string> = { contact: "Formulário de contato", caravan_interest: "Formulário de caravana", popup: "Pop-up", manual: "Cadastro manual", whatsapp: "WhatsApp", phone: "Telefone", referral: "Indicação", social: "Rede social", other: "Outro" };
const stages = ["Leads da coorte", "Contato confirmado", "Orçamento solicitado", "Proposta enviada", "Venda confirmada"];

export function ResultsOverview({ report, filters }: { report: Report; filters: ReportFilters }) {
  const { totals: t } = report;
  const metrics = [
    { label: "Sessões medidas", value: report.measuredTraffic ? t.sessions : null, sub: report.measuredTraffic ? number.format(t.visitors) + " navegadores identificados" + (report.coversFullPeriod ? "" : " · cobertura parcial") : report.coverageStart ? "Disponível por data do evento, sem filtros comerciais" : "Ainda não há medição disponível", icon: Eye },
    { label: "Tentativas no WhatsApp", value: t.attempts, sub: number.format(t.clicks) + " cliques registrados", icon: MessageCircle },
    { label: "Leads identificados", value: t.leads, sub: number.format(t.forms) + " formulários confirmados", icon: Users },
    { label: "Vendas confirmadas", value: t.sales, sub: number.format(t.cancelled) + " cancelamentos registrados", icon: CircleDollarSign },
  ];
  return <section aria-label="Resumo de conversões" className="space-y-4">
    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, sub, icon: Icon }) => <Card key={label} className="rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leehov-surface text-leehov-blue-600"><Icon className="size-5" aria-hidden /></span>
          <div><p className="text-sm font-bold text-leehov-muted">{label}</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-leehov-navy-950">{value === null ? "—" : number.format(value)}</p></div>
        </div>
        <p className="mt-2 text-xs leading-5 text-leehov-muted">{sub}</p>
      </Card>)}
    </div>
    <Card className="rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-5">
      <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-5">
        <Summary label="Visualizações de caravanas" value={number.format(t.views)} />
        <Summary label="Contatos recebidos" value={number.format(t.contact)} />
        <Summary label="Orçamentos solicitados" value={number.format(t.quotes)} />
        <Summary label="Propostas enviadas" value={number.format(t.proposals)} />
        <Summary label="Valor vendido após cancelamentos" value={Object.entries(report.revenue).map(([currency, value]) => money(value, currency)).join(" · ") || "—"} />
      </div>
      {!!report.navigationRates.length && <div className="mt-4 grid gap-3 border-t border-leehov-border pt-3 sm:grid-cols-3">
        {report.navigationRates.map((item) => <Summary key={item.label} label={item.label} value={number.format(item.count) + " / " + number.format(item.denominator) + (item.rate === null ? "" : " · " + percent.format(item.rate))} />)}
      </div>}
      <p className="mt-4 border-t border-leehov-border pt-3 text-sm leading-6 text-leehov-muted">
        {filters.mode === "cohort" ? "Os resultados pertencem a leads criados no período, com etapas registradas até hoje. Cliques exibidos têm vínculo com esses leads." : "Cada resultado é contado na data em que ocorreu. Visitas e cliques medidos dependem do consentimento e do navegador."} {report.coverageStart && !report.coversFullPeriod && " A medição disponível começa em " + dateLabel(report.coverageStart) + "; os totais de cliques e visualizações podem ser parciais."} Uma tentativa reúne cliques da mesma sessão para a mesma caravana. Abrir o WhatsApp não confirma uma conversa.
      </p>
    </Card>
  </section>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-xs font-medium leading-5 text-leehov-muted">{label}</p><p className="mt-1 break-words text-base font-extrabold text-leehov-navy-950">{value}</p></div>;
}

export function EvolutionAndFunnel({ report, filters }: { report: Report; filters: ReportFilters }) {
  const days = report.days;
  const max = Math.max(1, ...days.map((d) => Math.max(d.leads, d.quotes, d.sales)));
  const domainStart = Date.parse(filters.from + "T12:00:00Z");
  const domainEnd = Date.parse(filters.to + "T12:00:00Z");
  const byDay = new Map(days.map((d) => [d.day, d]));
  const graph = Array.from({ length: (domainEnd - domainStart) / 86400_000 + 1 }, (_, i) => {
    const day = new Date(domainStart + i * 86400_000).toISOString().slice(0,10);
    return { day, leads: byDay.get(day)?.leads ?? 0, quotes: byDay.get(day)?.quotes ?? 0, sales: byDay.get(day)?.sales ?? 0 };
  });
  const series = [
    { field: "leads", label: "Leads", color: "var(--color-leehov-blue-600)", dash: undefined },
    { field: "quotes", label: "Orçamentos", color: "var(--color-leehov-navy-950)", dash: "3 5" },
    { field: "sales", label: "Vendas", color: "#08774f", dash: "6 4" },
  ] as const;
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
    <Card className="min-w-0 rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-leehov-navy-950"><ChartNoAxesCombined className="size-5 text-leehov-blue-600" />Evolução diária</h2>
      <p className="mt-1 text-sm text-leehov-muted">{filters.mode === "event" ? "Data de cada evento" : "Dia de criação dos leads da coorte"} · horário de Brasília</p>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-leehov-muted">{series.map((line) => <span key={line.field} className="inline-flex items-center gap-1.5"><span style={{ backgroundColor: line.color }} className="size-2.5 rounded-full" />{line.label}</span>)}</div>
      {max === 1 && graph.every((d) => !d.leads && !d.quotes && !d.sales)
        ? <p className="grid min-h-44 place-items-center text-sm text-leehov-muted">Sem resultados no período.</p>
        : <svg role="img" aria-label="Evolução diária de leads, orçamentos e vendas" className="mt-4 h-40 w-full" viewBox="0 0 600 155" preserveAspectRatio="none">
          {[10, 45, 80, 115, 150].map((y) => <line key={y} x1="4" x2="596" y1={y} y2={y} stroke="var(--color-leehov-border)" />)}
          {series.map((line) => {
            const points = graph.map((d, i) => [graph.length > 1 ? 4 + i * 592 / (graph.length - 1) : 300, 150 - (d[line.field] / max) * 140]);
            return <g key={line.field}><polyline fill="none" stroke={line.color} strokeDasharray={line.dash} strokeWidth="2.5" vectorEffect="non-scaling-stroke" points={points.map((point) => point.join(",")).join(" ")} />{points.length === 1 ? <circle cx={points[0][0]} cy={points[0][1]} r="4" fill={line.color} /> : null}</g>;
          })}
        </svg>}
      <div className="flex justify-between text-xs text-leehov-muted"><span>{dateOnly(filters.from)}</span><span>{dateOnly(filters.to)}</span></div>
      <details className="mt-3"><summary className="cursor-pointer text-sm font-bold text-leehov-blue-600">Ver dados diários</summary><div className="mt-2 max-h-64 overflow-auto"><table className="w-full text-left text-sm">
        <thead><tr>{["Data","Leads","Orçamentos","Vendas"].map((value) => <th key={value} className="p-2">{value}</th>)}</tr></thead>
        <tbody>{graph.map((day) => <tr key={day.day} className="border-t border-leehov-border"><td className="p-2">{dateLabel(day.day)}</td><td className="p-2">{day.leads}</td><td className="p-2">{day.quotes}</td><td className="p-2">{day.sales}</td></tr>)}</tbody>
      </table></div></details>
    </Card>
    <Card className="rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-6">
      <h2 className="text-lg font-extrabold text-leehov-navy-950">Funil comercial da coorte</h2>
      <p className="mt-1 text-sm leading-5 text-leehov-muted">Etapas registradas em ordem nos 30 dias após criar o lead. {report.pending ? number.format(report.pending) + " leads ainda estão nessa janela." : "Todos os leads do período já completaram a janela."}</p>
      <ol className="mt-4 space-y-3">{report.funnel.map((step, i) => <li key={stages[i]}>
        <div className="flex justify-between gap-3 text-sm"><span className="font-bold text-leehov-navy-950">{stages[i]}</span><span className="text-right tabular-nums text-leehov-muted">{number.format(step.count)}{step.denominator !== null && " / " + number.format(step.denominator)}{step.rate !== null && " · " + percent.format(step.rate)}</span></div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-leehov-surface" aria-hidden><div className="h-full rounded-full bg-leehov-blue-600" style={{ width: (report.funnel[0].count ? 100 * step.count / report.funnel[0].count : 0) + "%" }} /></div>
      </li>)}</ol>
      <p className="mt-4 text-xs leading-5 text-leehov-muted">Cada taxa divide os leads que chegaram à etapa pelos que passaram pela anterior. Uma venda registrada continua no histórico mesmo se for cancelada.</p>
    </Card>
  </div>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[540px] border-collapse text-left text-sm">
    <thead className="bg-leehov-surface text-xs font-bold text-leehov-navy-950"><tr>{headers.map((label) => <th key={label} scope="col" className="px-3 py-3">{label}</th>)}</tr></thead>
    <tbody className="divide-y divide-leehov-border text-leehov-muted">{children}</tbody>
  </table></div>;
}

export function OriginBreakdown({ report, caravans }: { report: Report; caravans: Lookup }) {
  const rows = report.origins;
  const packages = report.caravans;
  const cells = "px-3 py-3 tabular-nums";
  return <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
    <Card className="min-w-0 overflow-hidden rounded-[18px] border-leehov-border shadow-leehov-card">
      <div className="p-5"><h2 className="text-lg font-extrabold text-leehov-navy-950">Origens e campanhas</h2><p className="mt-1 text-sm text-leehov-muted">Compare o volume e o resultado de cada origem.</p></div>
      <DataTable headers={["Origem e campanha", "Cliques", "Leads", "Contatos", "Vendas", "Valor após cancelamentos"]}>
        {rows.map(({ channel, medium, campaign, campaignId, counts, revenue }) => <tr key={JSON.stringify([channel, medium, campaignId || campaign])}>
          <th scope="row" className="px-3 py-3 font-bold text-leehov-navy-950">{channelLabels[channel]}<span className="block break-words text-xs font-normal text-leehov-muted">{[medium, campaign, campaignId && "ID " + campaignId].filter(Boolean).join(" · ") || "Campanha não identificada"}</span></th>
          <td className={cells}>{number.format(counts.clicks)}</td><td className={cells}>{number.format(counts.leads)}</td><td className={cells}>{number.format(counts.contact)}</td><td className={cells}>{number.format(counts.sales)}</td><td className={cells}>{Object.entries(revenue).map(([currency, v]) => money(v,currency)).join(" · ") || "—"}</td>
        </tr>)}
        {!rows.length && <tr><td colSpan={6} className={cells}>Nenhuma origem encontrada para os filtros.</td></tr>}
      </DataTable>
    </Card>
    <Card className="min-w-0 overflow-hidden rounded-[18px] border-leehov-border shadow-leehov-card">
      <div className="p-5"><h2 className="text-lg font-extrabold text-leehov-navy-950">Desempenho por caravana</h2><p className="mt-1 text-sm text-leehov-muted">Em leads, a caravana principal do cadastro.</p></div>
      <DataTable headers={["Caravana", "Visualizações", "Cliques", "Leads", "Vendas"]}>
        {packages.map((item) => <tr key={item.id}><th scope="row" className="px-3 py-3 font-bold text-leehov-navy-950">{caravans.get(item.id) ?? "Caravana indisponível"}</th><td className={cells}>{item.views}</td><td className={cells}>{item.clicks}</td><td className={cells}>{item.leads}</td><td className={cells}>{item.sales}</td></tr>)}
        {!packages.length && <tr><td colSpan={5} className={cells}>Nenhuma caravana com dados neste período.</td></tr>}
      </DataTable>
    </Card>
  </div>;
}

export function CostOverview({ report }: { report: Report }) {
  const costs = report.costs;
  return <Card className="rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-6">
    <h2 className="text-lg font-extrabold text-leehov-navy-950">Investimento e retorno</h2>
    <p className="mt-1 text-sm leading-6 text-leehov-muted">Gasto realizado informado pela equipe. Os cálculos usam os dias completos com dados da mesma campanha, com a origem observada e valores na mesma moeda. O dia de hoje entra após encerrar.</p>
    {costs.length ? <div className="mt-4 space-y-4">{costs.map((cost) => {
      const per = (count: number) => cost.matched && count > 0 ? money(Math.round(cost.spend / count), cost.currency) : "—";
      return <div key={cost.currency} className="rounded-xl border border-leehov-border p-4">
        <p className="text-sm font-bold text-leehov-navy-950">{cost.currency} · {number.format(cost.days.length)} dias com gasto informado</p>
        <p className="mt-1 text-xs text-leehov-muted">Entre {dateLabel(cost.days[0])} e {dateLabel(cost.days.at(-1)!)}. Dias sem valor cadastrado não entram no cálculo.</p>
        <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
          <Summary label="Investimento informado" value={money(cost.spend, cost.currency)} /><Summary label="Por tentativa" value={per(cost.attempts)} />
          <Summary label="Por lead" value={per(cost.leads)} /><Summary label="Por orçamento" value={per(cost.quotes)} />
          <Summary label="Por venda" value={per(cost.sales)} /><Summary label="ROAS (receita / gasto)" value={cost.roas === null ? "—" : number.format(Math.round(cost.roas * 100) / 100) + "×"} />
        </div>
      </div>;
    })}</div> : <p className="mt-4 text-sm text-leehov-muted">Sem dados comparáveis. Use data do evento, origem da conversão e registros reais, sem filtros de consultor, caravana ou etapa.</p>}
  </Card>;
}

export function LeadBreakdown({ leads, names, caravans, owners, page, pageCount, base }: {
  leads: (ReportLead & { reportOrigin: ClassifiedTouch; reportEvidence: keyof typeof evidenceLabels })[]; names: Map<string, { name: string; phone: string }>;
  caravans: Lookup; owners: Lookup; page: number; pageCount: number; base: string;
}) {
  return <Card className="min-w-0 overflow-hidden rounded-[18px] border-leehov-border shadow-leehov-card">
    <div className="flex flex-wrap items-end justify-between gap-2 p-5"><div><h2 className="text-lg font-extrabold text-leehov-navy-950">Leads do relatório</h2><p className="mt-1 text-sm text-leehov-muted">A origem exibida corresponde ao último registro que passou pelos filtros. Abra o lead para consultar o histórico.</p></div>
      {pageCount > 1 && <div className="flex gap-3 text-sm font-bold text-leehov-blue-600">{page > 1 && <Link href={base + "&page=" + (page - 1)}>Anterior</Link>}<span className="text-leehov-muted">{page} / {pageCount}</span>{page < pageCount && <Link href={base + "&page=" + (page + 1)}>Próxima</Link>}</div>}
    </div>
    <DataTable headers={["Lead", "Origem de aquisição", "Canal de atendimento", "Caravana / consultor", "Etapa atual", "Criado em"]}>
      {leads.map((lead) => {
        const row = names.get(lead.id);
        const origin = lead.reportOrigin;
        const stage = lead.commercial_stage as keyof typeof stageLabels | null;
        return <tr key={lead.id}>
          <td className="px-3 py-3">{row ? <Link href={"/admin/leads/" + lead.id} className="inline-flex items-center gap-1 font-bold text-leehov-blue-600 hover:underline">{row.name}<ArrowUpRight className="size-3" /></Link> : <span>Lead {lead.id.slice(0, 8)}</span>}{lead.is_test && <Badge className="ml-1" variant="secondary">Teste</Badge>}</td>
          <td className="px-3 py-3"><span className="font-bold text-leehov-navy-950">{channelLabels[origin.channel]}</span><span className="block text-xs">{[origin.campaign ?? origin.campaignId, evidenceLabels[lead.reportEvidence]].filter(Boolean).join(" · ")}</span></td>
          <td className="px-3 py-3">{sourceLabels[lead.source] ?? "Outro"}</td>
          <td className="px-3 py-3">{caravans.get(lead.caravan_id ?? "") ?? "—"}<span className="block text-xs">{owners.get(lead.assigned_to ?? "") ?? "Sem consultor"}</span></td>
          <td className="px-3 py-3"><Badge variant="outline">{stage ? stageLabels[stage] : "Sem etapa registrada"}</Badge></td>
          <td className="px-3 py-3">{dateLabel(localDay(lead.created_at))}</td>
        </tr>;
      })}
      {!leads.length && <tr><td colSpan={6} className="px-3 py-4">Nenhum lead encontrado para os filtros.</td></tr>}
    </DataTable>
  </Card>;
}
