"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Archive, CalendarClock, Copy, GripVertical, MailPlus, Play, Plus, Send, Trash2, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { EmailLog } from "@/features/emails/types";
import type { MediaAsset } from "@/features/media/types";
import { addManualNewsletterSubscriberAction, archiveNewsletterCampaignAction, cancelNewsletterCampaignAction, cloneNewsletterCampaignAction, deleteNewsletterCampaignDraftAction, resumeNewsletterCampaignAction, saveNewsletterCampaignAction, scheduleNewsletterCampaignAction, sendNewsletterCampaignNowAction, sendNewsletterCampaignTestAction } from "@/features/newsletter/campaign-actions";
import type { NewsletterCampaign, NewsletterCampaignBlock, NewsletterCampaignBlockType, NewsletterStatus, NewsletterSubscriber } from "@/features/newsletter/types";

const subscriberColumn = createColumnHelper<NewsletterSubscriber>();
const logColumn = createColumnHelper<EmailLog>();
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const statusLabels: Record<NewsletterStatus, string> = { pending: "Pendente", active: "Ativo", unsubscribed: "Cancelado" };
const campaignLabels = { draft: "Rascunho", scheduled: "Agendada", sending: "Enviando", paused: "Pausada", sent: "Enviada", cancelled: "Cancelada" } as const;
const blockLabels: Record<NewsletterCampaignBlockType, string> = { heading: "Título", paragraph: "Parágrafo", image: "Imagem", button: "Botão", divider: "Divisor", spacer: "Espaçamento" };

export function AdminNewsletterTable({ subscribers, logs, campaigns, media, isAdmin }: { subscribers: NewsletterSubscriber[]; logs: EmailLog[]; campaigns: NewsletterCampaign[]; media: MediaAsset[]; isAdmin: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [campaignDialog, setCampaignDialog] = useState(false);
  const [editing, setEditing] = useState<NewsletterCampaign | null>(null);
  const [subscriberDialog, setSubscriberDialog] = useState(false);
  const sources = useMemo(() => Array.from(new Set(subscribers.map((item) => item.source))).sort(), [subscribers]);
  const filtered = useMemo(() => subscribers.filter((item) => (status === "all" || item.status === status) && (source === "all" || item.source === source) && `${item.name} ${item.email}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))), [query, source, status, subscribers]);
  const subscriberColumns = useMemo(() => [
    subscriberColumn.accessor("email", { header: "Inscrito", cell: ({ row }) => <div className="min-w-[240px]"><p className="font-bold text-leehov-navy-950">{row.original.name || "Nome não informado"}</p><p className="text-xs text-leehov-muted">{row.original.email}</p></div> }),
    subscriberColumn.accessor("source", { header: "Origem", cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge> }),
    subscriberColumn.accessor("status", { header: "Status", cell: ({ getValue }) => <Badge variant={getValue() === "active" ? "default" : "outline"}>{statusLabels[getValue()]}</Badge> }),
    subscriberColumn.accessor("createdAt", { header: "Cadastro", cell: ({ getValue }) => <span className="whitespace-nowrap">{dateFormatter.format(new Date(getValue()))}</span> }),
    subscriberColumn.accessor("confirmedAt", { header: "Confirmação", cell: ({ getValue }) => getValue() ? <span className="whitespace-nowrap">{dateFormatter.format(new Date(getValue()!))}</span> : "—" }),
  ], []);
  const logColumns = useMemo(() => [
    logColumn.accessor("createdAt", { header: "Data", cell: ({ getValue }) => <span className="whitespace-nowrap">{dateFormatter.format(new Date(getValue()))}</span> }),
    logColumn.accessor("templateKey", { header: "Template", cell: ({ getValue }) => <code className="text-xs">{getValue()}</code> }),
    logColumn.accessor("recipientEmail", { header: "Destinatário", cell: ({ getValue }) => getValue() || "Não configurado" }),
    logColumn.accessor("status", { header: "Status", cell: ({ getValue }) => <Badge variant={getValue() === "sent" ? "default" : getValue() === "failed" ? "destructive" : "outline"}>{getValue()}</Badge> }),
    logColumn.accessor("errorMessage", { header: "Detalhe", cell: ({ getValue }) => <span className="block max-w-[280px] truncate text-xs text-leehov-muted" title={getValue() || undefined}>{getValue() || "—"}</span> }),
  ], []);
  // TanStack Table intentionally exposes non-memoizable functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const subscriberTable = useReactTable({ data: filtered, columns: subscriberColumns, getCoreRowModel: getCoreRowModel() });
  const logTable = useReactTable({ data: logs, columns: logColumns, getCoreRowModel: getCoreRowModel() });

  return <><Tabs defaultValue="campaigns" className="space-y-5"><TabsList><TabsTrigger value="campaigns">Campanhas</TabsTrigger><TabsTrigger value="subscribers">Inscritos</TabsTrigger><TabsTrigger value="logs">Logs de e-mail</TabsTrigger></TabsList><TabsContent value="campaigns" className="space-y-5"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Antes de disparar, confira a cota disponível no Resend. O processamento usa lotes pequenos e pausa a campanha quando o provedor informa limite excedido.</div><div className="flex justify-end"><Button onClick={() => { setEditing(null); setCampaignDialog(true); }}><Plus />Nova campanha</Button></div><CampaignList campaigns={campaigns} isAdmin={isAdmin} onEdit={(campaign) => { setEditing(campaign); setCampaignDialog(true); }} /></TabsContent><TabsContent value="subscribers" className="space-y-5"><div className="flex justify-end">{isAdmin ? <Button variant="outline" onClick={() => setSubscriberDialog(true)}><MailPlus />Adicionar inscrito</Button> : null}</div><div className="grid gap-3 md:grid-cols-[1fr_180px_200px]"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou e-mail" /><Filter value={status} setValue={setStatus} all="Todos os status" items={Object.entries(statusLabels)} /><Filter value={source} setValue={setSource} all="Todas as origens" items={sources.map((item) => [item, item])} /></div><DataTable table={subscriberTable} columnCount={subscriberColumns.length} empty="Nenhum inscrito encontrado." /></TabsContent><TabsContent value="logs"><DataTable table={logTable} columnCount={logColumns.length} empty="Nenhuma tentativa de e-mail registrada." /></TabsContent></Tabs><CampaignEditor open={campaignDialog} onOpenChange={setCampaignDialog} campaign={editing} media={media} isAdmin={isAdmin} /><ManualSubscriberDialog open={subscriberDialog} onOpenChange={setSubscriberDialog} /></>;
}

function CampaignList({ campaigns, isAdmin, onEdit }: { campaigns: NewsletterCampaign[]; isAdmin: boolean; onEdit: (campaign: NewsletterCampaign) => void }) {
  const [pending, startTransition] = useTransition();
  const act = (operation: () => Promise<{ success: boolean; message: string }>) => startTransition(async () => { const result = await operation(); if (result.success) { toast.success(result.message); window.location.reload(); } else toast.error(result.message); });
  return <div className="grid gap-4">{campaigns.map((campaign) => <Card key={campaign.id} className="rounded-[18px] border-leehov-border p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Badge>{campaignLabels[campaign.status]}</Badge><Badge variant="outline">{campaign.recipientCount} destinatários</Badge><Badge variant="outline">{campaign.sentCount} enviados</Badge>{campaign.failedCount ? <Badge variant="destructive">{campaign.failedCount} falhas</Badge> : null}</div><h3 className="mt-3 text-lg font-bold text-leehov-navy-950">{campaign.internalTitle}</h3><p className="mt-1 text-sm text-leehov-muted">Assunto: {campaign.subject}</p>{campaign.scheduledAt ? <p className="mt-1 text-xs text-leehov-muted">Agendada: {dateFormatter.format(new Date(campaign.scheduledAt))}</p> : null}{campaign.pauseReason ? <p className="mt-2 text-sm text-amber-700">{campaign.pauseReason}</p> : null}</div><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => onEdit(campaign)} disabled={campaign.status !== "draft"}>Editar</Button><Button variant="outline" size="sm" disabled={pending} onClick={() => act(() => cloneNewsletterCampaignAction(campaign.id))}><Copy />Clonar</Button>{campaign.status === "draft" ? <Button variant="destructive" size="sm" onClick={() => window.confirm("Excluir este rascunho?") && act(() => deleteNewsletterCampaignDraftAction(campaign.id))}><Trash2 /></Button> : null}{isAdmin && campaign.status === "paused" ? <Button size="sm" onClick={() => act(() => resumeNewsletterCampaignAction(campaign.id))}><Play />Retomar</Button> : null}{isAdmin && ["scheduled", "sending", "paused"].includes(campaign.status) ? <Button variant="destructive" size="sm" onClick={() => window.confirm("Cancelar esta campanha e todas as entregas pendentes?") && act(() => cancelNewsletterCampaignAction(campaign.id))}><X />Cancelar</Button> : null}{isAdmin && !campaign.archivedAt && ["sent", "cancelled"].includes(campaign.status) ? <Button variant="outline" size="sm" disabled={pending} onClick={() => window.confirm("Arquivar esta campanha?") && act(() => archiveNewsletterCampaignAction(campaign.id))}><Archive />Arquivar</Button> : null}</div></div></Card>)}{!campaigns.length ? <Card className="rounded-[18px] border-leehov-border p-12 text-center text-leehov-muted">Nenhuma campanha criada.</Card> : null}</div>;
}

type CampaignEditorProps = { open: boolean; onOpenChange: (open: boolean) => void; campaign: NewsletterCampaign | null; media: MediaAsset[]; isAdmin: boolean };

function CampaignEditor(props: CampaignEditorProps) {
  return <CampaignEditorFields key={props.campaign?.id ?? "new"} {...props} />;
}

function CampaignEditorFields({ open, onOpenChange, campaign, media, isAdmin }: CampaignEditorProps) {
  const [form, setForm] = useState(() => campaignForm(campaign));
  const [scheduledAt, setScheduledAt] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const reset = () => setForm(campaignForm(campaign));
  const addBlock = (type: NewsletterCampaignBlockType) => setForm((current) => ({ ...current, content: [...current.content, newBlock(type)] }));
  const onDragEnd = ({ active, over }: DragEndEvent) => { if (!over || active.id === over.id) return; setForm((current) => { const oldIndex = current.content.findIndex((item) => item.id === active.id); const newIndex = current.content.findIndex((item) => item.id === over.id); return { ...current, content: arrayMove(current.content, oldIndex, newIndex) }; }); };
  const save = (next?: "schedule" | "send" | "test") => startTransition(async () => {
    const result = await saveNewsletterCampaignAction(form);
    if (!result.success || !result.id) { toast.error(result.message); return; }
    setForm((current) => ({ ...current, id: result.id! }));
    if (next === "schedule") {
      if (!scheduledAt) { toast.error("Informe a data do agendamento."); return; }
      const scheduled = await scheduleNewsletterCampaignAction({ id: result.id, scheduledAt: new Date(scheduledAt).toISOString() });
      if (!scheduled.success) { toast.error(scheduled.message); return; }
      toast.success(scheduled.message); onOpenChange(false); window.location.reload(); return;
    }
    if (next === "send") {
      if (!window.confirm("Confirmar o início do envio para toda a audiência ativa?")) return;
      const sent = await sendNewsletterCampaignNowAction(result.id); if (!sent.success) { toast.error(sent.message); return; } toast.success(sent.message); onOpenChange(false); window.location.reload(); return;
    }
    if (next === "test") {
      const tested = await sendNewsletterCampaignTestAction({ id: result.id, email: testEmail }); if (tested.success) toast.success(tested.message); else toast.error(tested.message); return;
    }
    toast.success(result.message);
  });
  return <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}><DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{campaign ? "Editar campanha" : "Nova campanha"}</DialogTitle><DialogDescription>Editor seguro por blocos, sem HTML livre. Horários são exibidos em America/Sao_Paulo e armazenados em UTC.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><Field label="Título interno"><Input value={form.internalTitle} onChange={(event) => setForm({ ...form, internalTitle: event.target.value })} /></Field><Field label="Assunto"><Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field><div className="sm:col-span-2"><Field label="Preheader"><Input value={form.preheader} onChange={(event) => setForm({ ...form, preheader: event.target.value })} /></Field></div></div><div className="mt-4 flex flex-wrap gap-2">{Object.entries(blockLabels).map(([type, label]) => <Button key={type} type="button" variant="outline" size="sm" onClick={() => addBlock(type as NewsletterCampaignBlockType)}><Plus />{label}</Button>)}</div><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={form.content.map((item) => item.id)} strategy={verticalListSortingStrategy}><div className="mt-4 space-y-3">{form.content.map((block) => <BlockEditor key={block.id} block={block} media={media} onChange={(next) => setForm((current) => ({ ...current, content: current.content.map((item) => item.id === next.id ? next : item) }))} onRemove={() => setForm((current) => ({ ...current, content: current.content.filter((item) => item.id !== block.id) }))} />)}</div></SortableContext></DndContext>{!form.content.length ? <div className="mt-4 rounded-2xl border border-dashed border-leehov-border p-8 text-center text-sm text-leehov-muted">Adicione ao menos um bloco.</div> : null}<div className="mt-6 flex flex-wrap items-end gap-3"><Button disabled={pending} onClick={() => save()}>Salvar rascunho</Button>{isAdmin ? <><Field label="E-mail de teste"><Input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /></Field><Button variant="outline" disabled={pending || !testEmail} onClick={() => save("test")}><Send />Enviar teste</Button><Field label="Agendar"><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></Field><Button variant="outline" disabled={pending || !scheduledAt} onClick={() => save("schedule")}><CalendarClock />Agendar</Button><Button className="bg-leehov-blue-600" disabled={pending} onClick={() => save("send")}><Play />Enviar agora</Button></> : null}</div></DialogContent></Dialog>;
}

function campaignForm(campaign: NewsletterCampaign | null) { return { id: campaign?.id ?? "", internalTitle: campaign?.internalTitle ?? "", subject: campaign?.subject ?? "", preheader: campaign?.preheader ?? "", content: campaign?.content ?? [] }; }
function newBlock(type: NewsletterCampaignBlockType): NewsletterCampaignBlock { const data = type === "heading" ? { text: "Novo título", level: 2 as const } : type === "paragraph" ? { text: "Escreva o conteúdo desta seção." } : type === "image" ? { assetId: "", alt: "" } : type === "button" ? { label: "Saiba mais", url: "https://leehovturismo.com.br" } : type === "spacer" ? { height: 24 } : {}; return { id: crypto.randomUUID(), type, data }; }

function BlockEditor({ block, media, onChange, onRemove }: { block: NewsletterCampaignBlock; media: MediaAsset[]; onChange: (block: NewsletterCampaignBlock) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const update = (data: NewsletterCampaignBlock["data"]) => onChange({ ...block, data });
  return <Card ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="rounded-2xl border-leehov-border p-4"><div className="flex items-center gap-3"><button type="button" {...attributes} {...listeners} className="cursor-grab text-leehov-muted" aria-label={`Reordenar bloco ${blockLabels[block.type]}`}><GripVertical /></button><Badge variant="outline">{blockLabels[block.type]}</Badge><Button type="button" size="icon" variant="ghost" className="ml-auto" onClick={onRemove}><Trash2 className="size-4" /></Button></div><div className="mt-3">{block.type === "heading" || block.type === "paragraph" ? <Textarea value={block.data.text ?? ""} onChange={(event) => update({ ...block.data, text: event.target.value })} /> : null}{block.type === "image" ? <div className="grid gap-3 sm:grid-cols-2"><Filter value={block.data.assetId || "none"} setValue={(assetId) => { const asset = media.find((item) => item.id === assetId); update({ ...block.data, assetId: assetId === "none" ? "" : assetId, alt: asset?.altText ?? block.data.alt }); }} all="Selecione uma imagem" showAll={false} items={[["none", "Sem imagem"], ...media.map((item) => [item.id, item.fileName])]} /><Input value={block.data.alt ?? ""} onChange={(event) => update({ ...block.data, alt: event.target.value })} placeholder="Texto alternativo" /></div> : null}{block.type === "button" ? <div className="grid gap-3 sm:grid-cols-2"><Input value={block.data.label ?? ""} onChange={(event) => update({ ...block.data, label: event.target.value })} placeholder="Texto do botão" /><Input value={block.data.url ?? ""} onChange={(event) => update({ ...block.data, url: event.target.value })} placeholder="https://..." /></div> : null}{block.type === "spacer" ? <Input type="number" min={8} max={120} value={block.data.height ?? 24} onChange={(event) => update({ ...block.data, height: Number(event.target.value) })} /> : null}{block.type === "divider" ? <hr className="border-leehov-border" /> : null}</div></Card>;
}

function ManualSubscriberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) { const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pending, startTransition] = useTransition(); return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Adicionar inscrito</DialogTitle><DialogDescription>O contato entrará como pendente e precisará confirmar o double opt-in.</DialogDescription></DialogHeader><Field label="Nome"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="E-mail"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field><Button disabled={pending} onClick={() => startTransition(async () => { const result = await addManualNewsletterSubscriberAction({ name, email }); if (result.success) { toast.success(result.message); onOpenChange(false); window.location.reload(); } else toast.error(result.message); })}>{pending ? "Processando…" : "Enviar confirmação"}</Button></DialogContent></Dialog>; }

function Filter({ value, setValue, all, items, showAll = true }: { value: string; setValue: (value: string) => void; all: string; items: string[][]; showAll?: boolean }) { return <Select value={value} onValueChange={setValue}><SelectTrigger><SelectValue placeholder={all} /></SelectTrigger><SelectContent>{showAll ? <SelectItem value="all">{all}</SelectItem> : null}{items.map(([itemValue, label]) => <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>)}</SelectContent></Select>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function DataTable<T>({ table, columnCount, empty }: { table: ReturnType<typeof useReactTable<T>>; columnCount: number; empty: string }) { return <Card className="overflow-hidden rounded-[18px] border-leehov-border p-0"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}{!table.getRowModel().rows.length ? <TableRow><TableCell colSpan={columnCount} className="h-32 text-center text-leehov-muted">{empty}</TableCell></TableRow> : null}</TableBody></Table></div></Card>; }
