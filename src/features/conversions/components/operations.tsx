"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { confirmWhatsAppContact, saveCampaignSpend, saveCommercialLead } from "../actions";
import { channelLabels } from "../attribution";
import { stageLabels } from "../commercial";
import { attributionOfLead, type ReportLead } from "../report";

const fieldClass = "h-10 min-w-0 w-full rounded-lg border border-leehov-border bg-white px-2.5 text-sm font-normal text-leehov-navy-950 focus-visible:outline-2 focus-visible:outline-leehov-blue-500";
const grid = "grid gap-3 sm:grid-cols-2";
const value = (data: FormData, name: string) => String(data.get(name) ?? "");
const displayedMoney = (amount: number | null) => amount === null ? "" : (amount / 100).toFixed(2);
const currencies = ["BRL", "USD", "EUR"];
const names = Object.entries(channelLabels);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1.5 text-sm font-bold text-leehov-navy-950">{label}{children}</label>;
}

function ChannelInput({ defaultValue = "", optional = false }: { defaultValue?: string; optional?: boolean }) {
  return <select name="channel" defaultValue={defaultValue} required={!optional} className={fieldClass}>
    <option value="">{optional ? "Sem origem informada" : "Escolha a origem"}</option>
    {names.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
  </select>;
}

function CurrencyInput({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  return <select name={name} defaultValue={defaultValue ?? "BRL"} className={fieldClass}>{currencies.map((code) => <option key={code}>{code}</option>)}</select>;
}

export function SpendForm({ today }: { today: string }) {
  const [busy, start] = useTransition();
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const result = await saveCampaignSpend({ day: value(data,"day"), channel: value(data,"channel"), medium: value(data,"medium"), campaign: value(data,"campaign"), campaignId: value(data,"campaignId"), currency: value(data,"currency"), amount: value(data,"amount") });
      if (!result.success) { toast.error(result.message); return; }
      toast.success(result.message); form.reset(); router.refresh();
    });
  }
  return <details className="rounded-[18px] border border-leehov-border bg-white p-4 shadow-leehov-card sm:p-5">
    <summary className="cursor-pointer font-extrabold text-leehov-navy-950">Registrar gasto realizado</summary>
    <p className="mt-2 text-sm leading-6 text-leehov-muted">Use a mesma origem e mídia do relatório. Informe o ID da campanha quando disponível; se não houver ID, use o nome. Salvar a mesma combinação de data, origem, mídia, campanha e moeda atualiza o valor informado.</p>
    <form className="mt-4 space-y-3" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Dia do gasto"><input className={fieldClass} type="date" name="day" max={today} defaultValue={today} required /></Field>
        <Field label="Origem"><ChannelInput /></Field>
        <Field label="Mídia"><input className={fieldClass} name="medium" maxLength={100} placeholder="Ex.: cpc" /></Field>
        <Field label="Campanha (sem ID)"><input className={fieldClass} name="campaign" maxLength={100} /></Field>
        <Field label="ID da campanha, se aparecer no relatório"><input className={fieldClass} name="campaignId" maxLength={100} /></Field>
        <Field label="Moeda"><CurrencyInput name="currency" /></Field>
        <Field label="Gasto realizado"><input className={fieldClass} name="amount" inputMode="decimal" placeholder="0,00" required /></Field>
      </div>
      <Button disabled={busy} className="bg-leehov-blue-600 text-white">Salvar investimento</Button>
    </form>
  </details>;
}

export function ConfirmContactForm({ reference = "", leadId = "", allowCreate = false }: { reference?: string; leadId?: string; allowCreate?: boolean }) {
  const [busy, start] = useTransition();
  const [resultId, setResultId] = useState("");
  const idempotency = useRef<string | null>(null);
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    idempotency.current ??= crypto.randomUUID();
    start(async () => {
      const result = await confirmWhatsAppContact({
        eventId: idempotency.current, reference: value(data,"reference"), leadId,
        name: value(data,"name"), phone: value(data,"phone"), email: value(data,"email"),
        reportedChannel: value(data,"channel"), reportedCampaign: value(data,"campaign"), caravanId: "",
        confirmed: data.get("received") === "on",
      });
      if (!result.success) { toast.error(result.message); return; }
      toast.success(result.message);
      setResultId(result.id ?? "");
      idempotency.current = null;
      router.refresh();
    });
  }

  if (resultId) return <p role="status" className="mt-3 text-sm font-bold text-leehov-navy-950">Contato registrado. <Link className="text-leehov-blue-600 underline" href={"/admin/leads/" + resultId}>Abrir lead</Link></p>;
  if (!leadId && !allowCreate) return <p className="mt-3 text-sm text-leehov-muted">Abra um lead existente para associar esta referência.</p>;
  return <form className="mt-4 space-y-3" onSubmit={submit}>
    <div className={grid}>
      <Field label="Referência da mensagem"><input className={fieldClass} name="reference" defaultValue={reference} maxLength={17} required={!leadId} placeholder="LH-…" autoComplete="off" /></Field>
      {!leadId ? <>
        <Field label="Nome"><input className={fieldClass} name="name" required maxLength={100} /></Field>
        <Field label="Telefone com DDD"><input className={fieldClass} type="tel" name="phone" required maxLength={24} /></Field>
        <Field label="E-mail (opcional)"><input className={fieldClass} type="email" name="email" maxLength={254} /></Field>
      </> : <>
        <Field label="Origem informada, se não houver referência"><ChannelInput optional /></Field>
        <Field label="Campanha informada (opcional)"><input className={fieldClass} name="campaign" maxLength={100} /></Field>
      </>}
    </div>
    <label className="flex items-center gap-2 text-sm text-leehov-navy-950"><input name="received" type="checkbox" required />Confirmo que a conversa chegou no WhatsApp.</label>
    <Button disabled={busy} className="bg-leehov-blue-600 text-white">Registrar contato recebido</Button>
  </form>;
}

export type CommercialDetails = ReportLead & {
  name: string; email: string | null; phone: string; next_action: string | null; loss_reason: string | null;
  proposal_minor: number | null; proposal_currency: string | null; sale_minor: number | null; sale_currency: string | null;
  contact_received_at: string | null; quote_requested_at: string | null; proposal_sent_at: string | null; closed_at: string | null;
};
const timestamp = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
export function CommercialLeadPanel({ lead, caravans, allowEdit, allowTestChange, linkedReferences, interests }: {
  lead: CommercialDetails; caravans: { id: string; title: string }[]; allowEdit: boolean; allowTestChange: boolean;
  linkedReferences: { reference: string | null; occurred_at: string }[]; interests: string[];
}) {
  const [busy, start] = useTransition();
  const [stage, setStage] = useState(lead.commercial_stage ?? "new");
  const [cancel, setCancel] = useState(false);
  const router = useRouter();
  const known = attributionOfLead(lead);
  const conversion = known.attribution.conversion;
  const dates = [["Contato", lead.contact_received_at], ["Orçamento", lead.quote_requested_at], ["Proposta", lead.proposal_sent_at], ["Fechamento", lead.closed_at]] as const;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const at = value(data,"at");
    start(async () => {
      const result = await saveCommercialLead({
        leadId: lead.id, stage, at: at ? at + ":00-03:00" : "", name: value(data,"name"), email: value(data,"email"), phone: value(data,"phone"),
        nextAction: value(data,"nextAction"), lossReason: value(data,"lossReason"), caravanId: value(data,"caravanId"),
        isTest: allowTestChange ? data.get("test") === "on" : undefined, cancelSale: cancel,
        proposal: value(data,"proposal"), proposalCurrency: value(data,"proposalCurrency"), sale: value(data,"sale"), saleCurrency: value(data,"saleCurrency"),
        reportedChannel: value(data,"channel"), reportedCampaign: value(data,"campaign"),
      });
      if (!result.success) { toast.error(result.message); return; }
      toast.success(result.message); setCancel(false); router.refresh();
    });
  }
  return <div className="space-y-4">
    <Card className="rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-6">
      <h3 className="text-lg font-extrabold text-leehov-navy-950">Origem e etapa comercial</h3>
      <div className="mt-3 grid gap-3 text-sm text-leehov-muted sm:grid-cols-3">
        {([["Primeira origem", known.attribution.first], ["Sessão", known.attribution.session], ["Origem da conversão", conversion]] as const).map(([label, touch]) => <div key={label}><p>{label}</p><p className="font-bold text-leehov-navy-950">{touch ? channelLabels[touch.channel] : "Origem desconhecida"}</p>{(touch?.campaign || touch?.campaignId) && <p className="break-words text-xs">{touch.campaign ?? touch.campaignId}</p>}</div>)}
      </div>
      <p className="mt-3 text-sm text-leehov-muted">{known.evidence === "observed" ? "Origem observada no site" : known.evidence === "reported" ? "Origem informada pela equipe" : known.evidence === "legacy" ? "Origem inferida de UTMs anteriores" : "Sem evidência de origem"}. {lead.is_test && "Registro de teste."}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-leehov-border pt-4 text-sm lg:grid-cols-4">{dates.map(([label, at]) => <div key={label}><p className="text-xs text-leehov-muted">{label}</p><p className="font-bold text-leehov-navy-950">{at ? timestamp.format(new Date(at)) : "—"}</p></div>)}</div>
      <p className="mt-4 text-sm text-leehov-muted">Caravanas de interesse: <strong className="text-leehov-navy-950">{[...new Set([lead.caravan_id, ...interests])].filter(Boolean).map((id) => caravans.find((c) => c.id === id)?.title).filter(Boolean).join(", ") || "Nenhuma informada"}</strong></p>
      {!!linkedReferences.length && <p className="mt-2 break-words text-sm text-leehov-muted">Referências vinculadas: <strong className="text-leehov-navy-950">{linkedReferences.map((item) => item.reference).join(", ")}</strong></p>}
      {allowEdit ? <form onSubmit={submit} className="mt-4 space-y-4 border-t border-leehov-border pt-4">
        <div className={grid}>
          <Field label="Nome"><input className={fieldClass} name="name" required maxLength={100} defaultValue={lead.name} /></Field>
          <Field label="E-mail"><input className={fieldClass} name="email" type="email" maxLength={254} defaultValue={lead.email ?? ""} /></Field>
          <Field label="Telefone com DDD"><input className={fieldClass} name="phone" type="tel" maxLength={24} defaultValue={lead.phone} required /></Field>
          <Field label="Etapa comercial"><select className={fieldClass} name="stage" value={stage} onChange={(event) => setStage(event.target.value)}>{Object.entries(stageLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
          <Field label="Data da etapa (Brasília)"><input className={fieldClass} type="datetime-local" name="at" /></Field>
          <Field label="Adicionar caravana de interesse"><select className={fieldClass} name="caravanId" defaultValue=""><option value="">Manter atual</option>{caravans.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
          <Field label="Próxima ação"><input className={fieldClass} name="nextAction" maxLength={240} defaultValue={lead.next_action ?? ""} /></Field>
          <Field label="Valor da proposta"><input className={fieldClass} name="proposal" inputMode="decimal" defaultValue={displayedMoney(lead.proposal_minor)} /></Field>
          <Field label="Moeda da proposta"><CurrencyInput name="proposalCurrency" defaultValue={lead.proposal_currency} /></Field>
          <Field label="Valor da venda"><input className={fieldClass} name="sale" inputMode="decimal" defaultValue={displayedMoney(lead.sale_minor)} required={stage === "won"} readOnly={lead.commercial_stage === "won"} /></Field>
          <Field label="Moeda da venda"><CurrencyInput name="saleCurrency" defaultValue={lead.sale_currency} /></Field>
          {stage === "lost" && <Field label="Motivo da perda"><input className={fieldClass} name="lossReason" required maxLength={500} defaultValue={lead.loss_reason ?? ""} /></Field>}
          {known.evidence !== "observed" && <><Field label="Origem informada"><ChannelInput optional defaultValue={known.evidence === "reported" ? conversion?.channel : ""} /></Field><Field label="Campanha informada"><input className={fieldClass} name="campaign" maxLength={100} defaultValue={known.evidence === "reported" ? conversion?.campaign : ""} /></Field></>}
        </div>
        {allowTestChange && <label className="flex items-center gap-2 text-sm text-leehov-navy-950"><input type="checkbox" name="test" defaultChecked={lead.is_test} />Marcar como registro de teste</label>}
        {lead.commercial_stage === "won" && stage !== "won" && <label className="flex items-center gap-2 text-sm font-bold text-leehov-navy-950"><input type="checkbox" checked={cancel} required onChange={(event) => setCancel(event.target.checked)} />Confirmo o cancelamento desta venda.</label>}
        <Button disabled={busy} className="bg-leehov-blue-600 text-white">Salvar dados comerciais</Button>
      </form> : <p className="mt-4 text-sm font-bold text-leehov-navy-950">Etapa: {stageLabels[stage as keyof typeof stageLabels] ?? "Não registrada"}</p>}
    </Card>
    {allowEdit && <Card className="rounded-[18px] border-leehov-border p-4 shadow-leehov-card sm:p-6">
      <h3 className="text-lg font-extrabold text-leehov-navy-950">Vincular conversa recebida</h3>
      <p className="mt-1 text-sm text-leehov-muted">Cole a referência da mensagem ou registre a origem informada quando ela não estiver disponível.</p>
      <ConfirmContactForm leadId={lead.id} />
    </Card>}
  </div>;
}
