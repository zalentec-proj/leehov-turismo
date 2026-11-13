import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { channelLabels } from "../attribution";
import { stageLabels } from "../commercial";
import type { ReportFilters } from "../report";

type Option = [string, string];
const inputStyle = "h-10 w-full min-w-0 rounded-lg border border-leehov-border bg-white px-2.5 text-sm text-leehov-navy-950 focus-visible:outline-2 focus-visible:outline-leehov-blue-500";

function SelectFilter({ name, label, value, options }: { name: string; label: string; value?: string; options: Option[] }) {
  return <label className="grid min-w-0 gap-1.5 text-xs font-bold text-leehov-navy-950">
    {label}<select name={name} defaultValue={value ?? ""} className={inputStyle}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
  </label>;
}

export function ReportFilterForm({ filters: f, caravans, owners }: {
  filters: ReportFilters; caravans: { id: string; title: string }[]; owners: { id: string; name: string }[];
}) {
  return <Card className="rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-5">
    <form action="/admin/conversoes" className="space-y-3" aria-label="Filtros de conversões">
      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <label className="grid min-w-0 gap-1.5 text-xs font-bold text-leehov-navy-950">De<input type="date" name="from" defaultValue={f.from} className={inputStyle} /></label>
        <label className="grid min-w-0 gap-1.5 text-xs font-bold text-leehov-navy-950">Até<input type="date" name="to" defaultValue={f.to} className={inputStyle} /></label>
        <SelectFilter name="mode" label="Tipo de relatório" value={f.mode} options={[["event", "Data do evento"], ["cohort", "Coorte de criação do lead"]]} />
        <SelectFilter name="basis" label="Atribuir por" value={f.basis} options={[["conversion", "Na conversão"], ["first", "Primeira origem"], ["session", "Origem da sessão"]]} />
        <SelectFilter name="channel" label="Origem" value={f.channel} options={[["", "Todas as origens"], ...Object.entries(channelLabels)]} />
        <SelectFilter name="records" label="Registros" value={f.records} options={[["real", "Somente reais"], ["test", "Somente testes"], ["all", "Reais e testes"]]} />
      </div>
      <details open={f.medium || f.campaign || f.caravan || f.owner || f.stage || f.evidence ? true : undefined}>
        <summary className="w-fit cursor-pointer rounded-sm py-1 text-sm font-bold text-leehov-blue-600">Mais filtros</summary>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <label className="grid min-w-0 gap-1.5 text-xs font-bold text-leehov-navy-950">Mídia<input name="medium" defaultValue={f.medium} placeholder="Ex.: cpc" maxLength={100} className={inputStyle} /></label>
          <label className="grid min-w-0 gap-1.5 text-xs font-bold text-leehov-navy-950">Campanha ou ID<input name="campaign" defaultValue={f.campaign} maxLength={100} className={inputStyle} /></label>
          <SelectFilter name="caravan" label="Caravana" value={f.caravan} options={[["", "Todas"], ...caravans.map((item): Option => [item.id, item.title])]} />
          <SelectFilter name="owner" label="Consultor" value={f.owner} options={[["", "Todos"], ...owners.map((item): Option => [item.id, item.name])]} />
          <SelectFilter name="stage" label="Etapa atual" value={f.stage} options={[["", "Todas"], ...Object.entries(stageLabels)]} />
          <SelectFilter name="evidence" label="Como foi identificada" value={f.evidence} options={[["", "Todos os tipos"], ["observed", "Observada no site"], ["reported", "Informada pela equipe"], ["legacy", "UTMs anteriores"], ["unknown", "Desconhecida"]]} />
        </div>
      </details>
      <div className="flex flex-wrap gap-2 border-t border-leehov-border pt-3">
        <Button className="bg-leehov-blue-600 text-white"><SlidersHorizontal className="size-4" />Aplicar filtros</Button>
        <Button asChild variant="ghost"><Link href="/admin/conversoes">Limpar</Link></Button>
      </div>
    </form>
  </Card>;
}
