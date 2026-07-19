"use client";
/* eslint-disable @typescript-eslint/no-unused-expressions -- Sonner is selected from action results. */

import { CheckCircle2, Pencil, Play, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteWebhookAction, retryWebhookDeliveryAction, saveWebhookAction, setWebhookActiveAction, testWebhookAction } from "@/features/webhooks/actions";
import { WEBHOOK_EVENTS, type Webhook, type WebhookDeliveryLog, type WebhookEvent } from "@/features/webhooks/types";

const EVENT_LABELS: Record<WebhookEvent, string> = {
  "lead.created": "Lead criado",
  "caravan_interest.created": "Interesse em caravana",
  "contact.created": "Contato criado",
  "newsletter.subscribed": "Inscrição iniciada",
  "newsletter.confirmed": "Newsletter confirmada",
  "google_review.created": "Avaliação Google criada",
  "google_review.low_rating": "Avaliação Google até 3 estrelas",
  "caravan.created": "Caravana criada",
  "caravan.updated": "Caravana atualizada",
  "caravan.published": "Caravana publicada",
  "blog_post.published": "Post publicado",
};

type FormState = { id: string; name: string; url: string; events: WebhookEvent[]; validationKey: string; active: boolean };
const emptyForm: FormState = { id: "", name: "", url: "", events: ["lead.created"], validationKey: "", active: false };

function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
}

export function AdminWebhooks({ webhooks, logs }: { webhooks: Webhook[]; logs: WebhookDeliveryLog[] }) {
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => webhooks.filter((item) => `${item.name} ${item.url} ${item.events.join(" ")}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))), [query, webhooks]);

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      result.success ? toast.success(result.message) : toast.error(result.message);
      if (result.success) window.location.reload();
    });
  }

  function edit(item: Webhook) {
    setForm({ id: item.id, name: item.name, url: item.url, events: item.events, validationKey: "", active: item.active });
    setDialogOpen(true);
  }

  return <Tabs defaultValue="webhooks" className="space-y-5">
    <TabsList><TabsTrigger value="webhooks">Webhooks</TabsTrigger><TabsTrigger value="history">Histórico</TabsTrigger></TabsList>
    <TabsContent value="webhooks" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input className="max-w-md" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, URL ou evento" />
        <Button className="bg-leehov-blue-600" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>Novo webhook</Button>
      </div>
      <Card className="overflow-hidden rounded-[18px] border-leehov-border shadow-leehov-card">
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Webhook</TableHead><TableHead>Eventos</TableHead><TableHead>Chave</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>
          {filtered.map((item) => <TableRow key={item.id}><TableCell className="min-w-[280px]"><p className="font-bold text-leehov-navy-950">{item.name}</p><p className="max-w-[420px] truncate text-xs text-leehov-muted">{item.url}</p></TableCell><TableCell className="min-w-[240px]"><div className="flex flex-wrap gap-1">{item.events.slice(0, 3).map((event) => <Badge key={event} variant="secondary">{EVENT_LABELS[event]}</Badge>)}{item.events.length > 3 ? <Badge variant="outline">+{item.events.length - 3}</Badge> : null}</div></TableCell><TableCell><Badge variant="outline">{item.validationKeyConfigured ? "Configurada" : "Ausente"}</Badge></TableCell><TableCell><Switch checked={item.active} disabled={pending} onCheckedChange={(active) => run(() => setWebhookActiveAction(item.id, active))} aria-label={`Ativar ${item.name}`} /></TableCell><TableCell><div className="flex gap-2"><Button size="icon-sm" variant="outline" disabled={pending} onClick={() => run(() => testWebhookAction({ id: item.id }))} title="Testar"><Play /></Button><Button size="icon-sm" variant="outline" onClick={() => edit(item)} title="Editar"><Pencil /></Button><Button size="icon-sm" variant="destructive" disabled={pending || item.active} onClick={() => { if (window.confirm("Excluir este webhook inativo e sem histórico?")) run(() => deleteWebhookAction(item.id)); }} title="Excluir"><Trash2 /></Button></div></TableCell></TableRow>)}
          {!filtered.length ? <TableRow><TableCell colSpan={5} className="h-36 text-center text-leehov-muted">Nenhum webhook configurado. A instalação começa vazia e inativa.</TableCell></TableRow> : null}
        </TableBody></Table></div>
      </Card>
    </TabsContent>
    <TabsContent value="history">
      <Card className="overflow-hidden rounded-[18px] border-leehov-border shadow-leehov-card"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Entrega</TableHead><TableHead>Evento</TableHead><TableHead>Status</TableHead><TableHead>Tentativas</TableHead><TableHead>Resultado</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader><TableBody>
        {logs.map((log) => <TableRow key={log.id}><TableCell className="min-w-[210px]"><p className="font-bold">{log.webhookName}</p><p className="font-mono text-[11px] text-leehov-muted">{log.deliveryId}</p><p className="text-xs text-leehov-muted">{formatDate(log.createdAt)}</p></TableCell><TableCell>{EVENT_LABELS[log.event]}</TableCell><TableCell>{log.status === "sent" ? <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 />Enviado</Badge> : log.status === "failed" ? <Badge variant="destructive"><XCircle />Falhou</Badge> : <Badge variant="secondary">Pendente</Badge>}</TableCell><TableCell>{log.attempts}</TableCell><TableCell className="max-w-[320px]"><p className="truncate text-sm">{log.errorMessage || log.responseBody || (log.responseStatus ? `HTTP ${log.responseStatus}` : "Aguardando entrega")}</p></TableCell><TableCell><Button size="sm" variant="outline" disabled={pending || log.status !== "failed"} onClick={() => { if (window.confirm("Reenviar esta mesma entrega, preservando payload e deliveryId?")) run(() => retryWebhookDeliveryAction({ id: log.id, confirmed: true })); }}><RotateCcw />Reenviar</Button></TableCell></TableRow>)}
        {!logs.length ? <TableRow><TableCell colSpan={6} className="h-36 text-center text-leehov-muted">Nenhuma entrega registrada.</TableCell></TableRow> : null}
      </TableBody></Table></div></Card>
    </TabsContent>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{form.id ? "Editar webhook" : "Novo webhook"}</DialogTitle><DialogDescription>A chave é criptografada e nunca volta a ser exibida. Use uma URL pública; redes privadas e redirecionamentos são bloqueados.</DialogDescription></DialogHeader><div className="space-y-5"><Field label="Nome"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="URL do endpoint"><Input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://automacao.exemplo.com/leehov" /></Field><Field label={form.id ? "Substituir chave de validação (opcional)" : "Chave de validação"}><Input type="password" autoComplete="new-password" value={form.validationKey} onChange={(event) => setForm({ ...form, validationKey: event.target.value })} placeholder={form.id ? "Deixe vazio para manter a atual" : "Mínimo de 16 caracteres"} /></Field><div><Label>Eventos</Label><div className="mt-3 grid gap-2 sm:grid-cols-2">{WEBHOOK_EVENTS.map((event) => <label key={event} className="flex min-h-10 items-center gap-3 rounded-lg border border-leehov-border px-3 text-sm"><Checkbox checked={form.events.includes(event)} onCheckedChange={(checked) => setForm({ ...form, events: checked ? [...form.events, event] : form.events.filter((item) => item !== event) })} />{EVENT_LABELS[event]}</label>)}</div></div><label className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} />Ativo</label><Button className="w-full bg-leehov-blue-600" disabled={pending} onClick={() => run(async () => { const result = await saveWebhookAction(form); if (result.success) setDialogOpen(false); return result; })}>{pending ? "Salvando…" : "Salvar webhook"}</Button></div></DialogContent></Dialog>
  </Tabs>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
