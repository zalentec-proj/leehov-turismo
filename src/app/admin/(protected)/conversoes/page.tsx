import { ChartNoAxesCombined, Download, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { channelLabels } from "@/features/conversions/attribution";
import { dateLabel, CostOverview, EvolutionAndFunnel, LeadBreakdown, OriginBreakdown, ResultsOverview } from "@/features/conversions/components/dashboard";
import { ConfirmContactForm, SpendForm } from "@/features/conversions/components/operations";
import { ReportFilterForm } from "@/features/conversions/components/report-filters";
import { filtersQuery, findContactReference, getConversionLeadNames, getConversionReport, parseReportFilters } from "@/features/conversions/queries";
import { localDay, originFrom } from "@/features/conversions/report";

export default async function ConversionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseReportFilters(params);
  const { report, leads, caravans, owners, access, generatedAt } = await getConversionReport(filters);
  const canViewLeads = access.permissions.includes("leads.view");
  const canLink = canViewLeads && access.permissions.includes("leads.update");
  const canCreate = access.permissions.includes("leads.create");
  const reference = typeof params.reference === "string" ? params.reference.trim().toUpperCase().slice(0, 17) : "";
  const attempt = canLink && reference ? await findContactReference(reference) : null;
  const count = Math.max(1, Math.ceil(leads.length / 30));
  const page = Math.min(count, Math.max(1, Number(typeof params.page === "string" && /^\d{1,8}$/.test(params.page) ? params.page : "1")));
  const visible = leads.slice((page - 1) * 30, page * 30);
  const names = canViewLeads ? await getConversionLeadNames(visible.map((row) => row.id)) : new Map<string, { name: string; phone: string }>();
  const caravanNames = new Map(caravans.map(({ id, title }) => [id, title]));
  const ownerNames = new Map(owners.map(({ id, name }) => [id, name]));
  const query = filtersQuery(filters);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Desempenho comercial</p>
        <h2 className="mt-2 flex items-center gap-2.5 text-3xl font-extrabold tracking-tight text-leehov-navy-950"><ChartNoAxesCombined className="size-7 shrink-0 text-leehov-blue-500" aria-hidden />Conversões e Leads</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-leehov-muted">Veja como as pessoas chegam à Leehov e quais visitas viram contatos, propostas e vendas.</p>
      </div>
      {canViewLeads && access.permissions.includes("conversions.export") && <Button asChild variant="outline"><a href={"/api/admin/conversoes/exportar?" + query}><Download className="size-4" />Exportar CSV</a></Button>}
    </div>
    <ReportFilterForm filters={filters} caravans={caravans} owners={owners} />
    <ResultsOverview report={report} filters={filters} />
    <EvolutionAndFunnel report={report} filters={filters} />
    <OriginBreakdown report={report} caravans={caravanNames} />
    {canLink && <Card className="rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-5">
      <h2 className="text-lg font-extrabold text-leehov-navy-950">Pesquisar referência do WhatsApp</h2>
      <p className="mt-1 text-sm leading-6 text-leehov-muted">Encontre o clique pelo código que chegou na mensagem. Se a referência foi apagada, abra o lead e informe a origem no atendimento.</p>
      <form action="/admin/conversoes" className="mt-3 flex flex-wrap items-end gap-2">
        {[...new URLSearchParams(query)].map(([key,value]) => <input type="hidden" key={key} name={key} value={value} />)}
        <label className="grid min-w-[180px] flex-1 gap-1.5 text-sm font-bold text-leehov-navy-950">Referência
          <input name="reference" maxLength={17} defaultValue={reference} placeholder="LH-…" autoComplete="off" required className="h-10 rounded-lg border border-leehov-border px-3 font-normal" />
        </label>
        <Button variant="outline"><Search className="size-4" />Pesquisar</Button>
      </form>
      {reference && !attempt && <p role="status" className="mt-3 text-sm text-leehov-muted">Referência não encontrada ou expirada.</p>}
      {attempt && <div className="mt-4 border-t border-leehov-border pt-3">
        <p className="text-sm font-bold text-leehov-navy-950">{attempt.reference} · {channelLabels[originFrom(attempt.attribution, "conversion").channel]}{attempt.is_test && " · Teste"}</p>
        <p className="mt-1 text-sm text-leehov-muted">{dateLabel(localDay(attempt.occurred_at))} · {caravanNames.get(attempt.caravan_id ?? "") ?? "Sem caravana associada"}</p>
        {attempt.linked_lead_id
          ? <Link className="mt-2 inline-block text-sm font-bold text-leehov-blue-600 underline" href={"/admin/leads/" + attempt.linked_lead_id}>Abrir lead vinculado</Link>
          : <ConfirmContactForm key={attempt.reference} reference={attempt.reference ?? ""} allowCreate={canCreate} />}
      </div>}
    </Card>}
    {canViewLeads && <LeadBreakdown leads={visible} names={names} caravans={caravanNames} owners={ownerNames} page={page} pageCount={count} base={"/admin/conversoes?" + query} />}
    <CostOverview report={report} />
    {access.permissions.includes("conversions.manage_costs") && <SpendForm today={generatedAt} />}
  </div>;
}
