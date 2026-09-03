"use client";

import { RotateCcw, Send, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { retryMetaConversionAction, saveMetaConversionSettingsAction, testMetaConversionAction } from "@/features/meta-conversions/actions";
import type { MetaConversionCampaign, MetaConversionEvent, MetaConversionSettings } from "@/features/meta-conversions/types";

function money(value: number | null) { return value === null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
function date(value: string) { return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—"; }
const STATUS: Record<MetaConversionEvent["status"], string> = { sent: "Enviado", failed: "Falhou", ignored: "Ignorado", pending: "Pendente", processing: "Processando", review_required: "Revisar" };

export function AdminMetaConversions({ settings, campaigns, events }: { settings: MetaConversionSettings; campaigns: MetaConversionCampaign[]; events: MetaConversionEvent[] }) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [testCode, setTestCode] = useState(settings.testEventCode);
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<{ success: boolean; message: string }>) { startTransition(async () => { const result = await action(); if (result.success) { toast.success(result.message); window.location.reload(); } else { toast.error(result.message); } }); }
  return <div className="space-y-6">
    <Card className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-leehov-blue-600" /><p className="font-bold text-leehov-navy-950">Envio seguro de Purchase</p></div><p className="mt-2 max-w-2xl text-sm text-leehov-muted">Somente vendas ganhas do Instagram Direct, nos dois roteiros abaixo, podem chegar à Meta. Dados pessoais e chaves não aparecem neste painel.</p><p className="mt-3 text-xs text-leehov-muted">Pixel {settings.pixelId} · Fonte RD {settings.sourceId}</p></div><div className="flex items-center gap-3"><span className="text-sm font-medium">{enabled ? "Ativo" : "Pausado"}</span><Switch checked={enabled} disabled={pending || !settings.credentialsReady} onCheckedChange={setEnabled} /></div></div>
      {!settings.credentialsReady ? <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Faltam credenciais protegidas na Vercel. O envio continua pausado até que elas sejam cadastradas.</p> : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]"><div><Label>Código temporário de teste do Pixel</Label><Input className="mt-2" value={testCode} onChange={(event) => setTestCode(event.target.value)} placeholder="TEST12345" /></div><Button className="self-end" variant="outline" disabled={pending} onClick={() => run(() => saveMetaConversionSettingsAction({ enabled, testEventCode: testCode }))}>Salvar</Button><Button className="self-end bg-leehov-blue-600" disabled={pending || !testCode} onClick={() => run(testMetaConversionAction)}><Send />Enviar teste</Button></div>
    </Card>
    <Card className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card"><h3 className="font-bold text-leehov-navy-950">Escopo autorizado</h3><p className="mt-2 text-sm text-leehov-muted">Os roteiros usam as campanhas já cadastradas no RD; nenhuma campanha de mídia é alterada aqui.</p><div className="mt-4 flex flex-wrap gap-2">{campaigns.map((campaign) => <Badge key={campaign.id} variant={campaign.active ? "secondary" : "outline"}>{campaign.name}</Badge>)}</div></Card>
    <Card className="overflow-hidden rounded-[18px] border-leehov-border shadow-leehov-card"><div className="border-b border-leehov-border p-6"><h3 className="font-bold text-leehov-navy-950">Histórico de conversões</h3><p className="mt-1 text-sm text-leehov-muted">Até 100 eventos recentes, sem dados de contato.</p></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Venda RD</TableHead><TableHead>Roteiro</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader><TableBody>{events.map((event) => <TableRow key={event.id}><TableCell className="font-mono text-xs">{event.dealId}</TableCell><TableCell>{event.routeName}</TableCell><TableCell>{money(event.saleValue)}</TableCell><TableCell><Badge variant={event.status === "failed" ? "destructive" : "secondary"}>{STATUS[event.status]}</Badge><p className="mt-1 max-w-64 truncate text-xs text-leehov-muted">{event.error}</p></TableCell><TableCell>{date(event.createdAt)}</TableCell><TableCell><Button size="sm" variant="outline" disabled={pending || event.status !== "failed"} onClick={() => run(() => retryMetaConversionAction({ id: event.id }))}><RotateCcw />Reenviar</Button></TableCell></TableRow>)}{!events.length ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-leehov-muted">Nenhuma conversão recebida ainda.</TableCell></TableRow> : null}</TableBody></Table></div></Card>
  </div>;
}
