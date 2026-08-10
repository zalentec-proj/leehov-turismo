"use client";

import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { CalendarClock, GripVertical, LayoutGrid, List, Loader2, MessageCircle, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createManualLeadAction, recordLeadWhatsAppInteractionAction, updateLeadPipelineAction } from "@/features/leads/actions";
import type { AdminLead, LeadOwner, LeadSource, LeadStatus } from "@/features/leads/types";

const statusLabels: Record<LeadStatus, string> = { new: "Novo", in_progress: "Em atendimento", converted: "Convertido", archived: "Arquivado" };
const sourceLabels: Record<LeadSource, string> = { contact: "Contato", caravan_interest: "Interesse em pacote", popup: "Pop-up", manual: "Manual", whatsapp: "WhatsApp", phone: "Telefone", referral: "Indicação", social: "Rede social", other: "Outro" };
const manualSources = ["manual", "whatsapp", "phone", "referral", "social", "other"] as const;
const columnHelper = createColumnHelper<AdminLead>();
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function applyTemplate(template: string, lead: AdminLead, consultant: string) {
  return template.replaceAll("{{nome}}", lead.name).replaceAll("{{caravana}}", lead.caravan?.title ?? "sua viagem").replaceAll("{{consultor}}", consultant);
}

function leadWhatsappUrl(lead: AdminLead, template: string, consultant: string) {
  return `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(applyTemplate(template, lead, consultant))}`;
}

type Props = {
  data: AdminLead[];
  owners: LeadOwner[];
  caravans: Array<{ id: string; title: string }>;
  whatsappTemplate: string;
  consultantName: string;
};

export function AdminLeadsTable({ data, owners, caravans, whatsappTemplate, consultantName }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [caravan, setCaravan] = useState("all");
  const [owner, setOwner] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [dialog, setDialog] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const filtered = useMemo(() => data.filter((lead) => {
    const overdue = lead.nextFollowUpAt && new Date(lead.nextFollowUpAt).getTime() < Date.now() && !["converted", "archived"].includes(lead.status);
    return (status === "all" || lead.status === status)
      && (source === "all" || lead.source === source)
      && (caravan === "all" || lead.caravanId === caravan)
      && (owner === "all" || (owner === "unassigned" ? !lead.assignedTo : lead.assignedTo === owner))
      && (!overdueOnly || overdue)
      && `${lead.name} ${lead.email} ${lead.phone}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
  }), [caravan, data, overdueOnly, owner, query, source, status]);

  const changeStatus = useCallback((lead: AdminLead, nextStatus: LeadStatus) => {
    if (lead.status === nextStatus) return;
    setPendingId(lead.id);
    startTransition(async () => {
      const result = await updateLeadPipelineAction({ id: lead.id, status: nextStatus });
      if (result.success) toast.success(result.message); else toast.error(result.message);
      setPendingId(null);
      window.location.reload();
    });
  }, []);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const lead = data.find((item) => item.id === active.id);
    const nextStatus = over.id as LeadStatus;
    if (lead && nextStatus in statusLabels) changeStatus(lead, nextStatus);
  };

  const columns = useMemo(() => [
    columnHelper.accessor("name", { header: "Lead", cell: ({ row }) => <Link href={`/admin/leads/${row.original.id}`} className="block min-w-[210px]"><p className="font-bold text-leehov-navy-950 hover:text-leehov-blue-600">{row.original.name}</p><p className="text-xs text-leehov-muted">{row.original.email || "Sem e-mail"}</p><p className="text-xs text-leehov-muted">{row.original.phone}</p></Link> }),
    columnHelper.accessor("source", { header: "Origem", cell: ({ getValue }) => <Badge variant="outline">{sourceLabels[getValue()]}</Badge> }),
    columnHelper.display({ id: "owner", header: "Responsável", cell: ({ row }) => row.original.assignee?.name || "Não atribuído" }),
    columnHelper.display({ id: "followup", header: "Próximo contato", cell: ({ row }) => row.original.nextFollowUpAt ? <span className={new Date(row.original.nextFollowUpAt).getTime() < Date.now() ? "font-bold text-red-600" : ""}>{dateFormatter.format(new Date(row.original.nextFollowUpAt))}</span> : "—" }),
    columnHelper.accessor("status", { header: "Status", cell: ({ row }) => <Select value={row.original.status} disabled={pendingId === row.original.id} onValueChange={(value) => changeStatus(row.original, value as LeadStatus)}><SelectTrigger className="w-[165px]"><SelectValue />{pendingId === row.original.id ? <Loader2 className="size-3 animate-spin" /> : null}</SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select> }),
    columnHelper.display({ id: "actions", header: "", cell: ({ row }) => <div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon"><a href={leadWhatsappUrl(row.original, whatsappTemplate, consultantName)} onClick={() => { void recordLeadWhatsAppInteractionAction(row.original.id); }} target="_blank" rel="noreferrer" aria-label={`Conversar com ${row.original.name} no WhatsApp`}><MessageCircle className="size-4" /></a></Button><Button asChild variant="ghost" size="sm"><Link href={`/admin/leads/${row.original.id}`}>Abrir</Link></Button></div> }),
  ], [changeStatus, consultantName, pendingId, whatsappTemplate]);
  // TanStack Table intentionally exposes non-memoizable functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: filtered, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-leehov-border bg-white p-1"><Button size="sm" variant={view === "table" ? "default" : "ghost"} onClick={() => setView("table")}><List />Tabela</Button><Button size="sm" variant={view === "kanban" ? "default" : "ghost"} onClick={() => setView("kanban")}><LayoutGrid />Kanban</Button></div>
        <Button className="bg-leehov-blue-600" onClick={() => setDialog(true)}><Plus />Novo lead</Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead" className="xl:col-span-2" />
        <Filter value={status} onChange={setStatus} all="Todos os status" items={Object.entries(statusLabels)} />
        <Filter value={source} onChange={setSource} all="Todas as origens" items={Object.entries(sourceLabels)} />
        <Filter value={caravan} onChange={setCaravan} all="Todos os pacotes" items={caravans.map((item) => [item.id, item.title])} />
        <Filter value={owner} onChange={setOwner} all="Todos responsáveis" items={[["unassigned", "Não atribuído"], ...owners.map((item) => [item.id, item.name])]} />
      </div>
      <Button variant={overdueOnly ? "default" : "outline"} size="sm" onClick={() => setOverdueOnly((value) => !value)}><CalendarClock />Acompanhamentos atrasados</Button>

      {view === "table" ? (
        <Card className="overflow-hidden rounded-[18px] border-leehov-border p-0"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}{!table.getRowModel().rows.length ? <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-leehov-muted">Nenhum lead encontrado.</TableCell></TableRow> : null}</TableBody></Table></div></Card>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}><div className="grid items-start gap-4 xl:grid-cols-4">{(Object.keys(statusLabels) as LeadStatus[]).map((item) => <KanbanColumn key={item} status={item} leads={filtered.filter((lead) => lead.status === item)} />)}</div></DndContext>
      )}
      <ManualLeadDialog open={dialog} onOpenChange={setDialog} owners={owners} caravans={caravans} />
    </div>
  );
}

function Filter({ value, onChange, all, items, showAll = true }: { value: string; onChange: (value: string) => void; all: string; items: string[][]; showAll?: boolean }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder={all} /></SelectTrigger><SelectContent>{showAll ? <SelectItem value="all">{all}</SelectItem> : null}{items.map(([itemValue, label]) => <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>)}</SelectContent></Select>;
}

function KanbanColumn({ status, leads }: { status: LeadStatus; leads: AdminLead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return <div ref={setNodeRef} className={`min-h-48 rounded-[18px] border p-3 ${isOver ? "border-leehov-blue-500 bg-sky-50" : "border-leehov-border bg-leehov-surface"}`}><div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-leehov-navy-950">{statusLabels[status]}</h3><Badge variant="outline">{leads.length}</Badge></div><div className="space-y-3">{leads.map((lead) => <KanbanCard key={lead.id} lead={lead} />)}</div></div>;
}

function KanbanCard({ lead }: { lead: AdminLead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  return <Card ref={setNodeRef} style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }} className={`rounded-2xl border-leehov-border p-4 ${isDragging ? "z-50 opacity-70 shadow-xl" : ""}`}><div className="flex items-start gap-2"><button type="button" className="mt-0.5 cursor-grab text-leehov-muted" {...listeners} {...attributes} aria-label={`Mover ${lead.name}`}><GripVertical className="size-4" /></button><Link href={`/admin/leads/${lead.id}`} className="min-w-0 flex-1"><p className="truncate font-bold text-leehov-navy-950">{lead.name}</p><p className="mt-1 truncate text-xs text-leehov-muted">{lead.caravan?.title ?? sourceLabels[lead.source]}</p><p className="mt-3 flex items-center gap-1 text-xs text-leehov-muted"><UserRound className="size-3" />{lead.assignee?.name ?? "Não atribuído"}</p></Link></div></Card>;
}

function ManualLeadDialog({ open, onOpenChange, owners, caravans }: { open: boolean; onOpenChange: (open: boolean) => void; owners: LeadOwner[]; caravans: Array<{ id: string; title: string }> }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", city: "", state: "", source: "manual", caravanId: "", assignedTo: "", nextFollowUpAt: "" });
  const [pending, startTransition] = useTransition();
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => startTransition(async () => {
    const result = await createManualLeadAction({ ...form, nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : "" });
    if (!result.success) { toast.error(result.message); return; }
    toast.success(result.message); onOpenChange(false); window.location.reload();
  });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Novo lead</DialogTitle><DialogDescription>Cadastre um contato recebido fora dos formulários do site.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome *"><Input value={form.name} onChange={(event) => set("name", event.target.value)} /></Field><Field label="WhatsApp *"><Input value={form.phone} onChange={(event) => set("phone", event.target.value)} /></Field><Field label="E-mail"><Input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} /></Field><Field label="Origem"><Filter value={form.source} onChange={(value) => set("source", value)} all="Origem" showAll={false} items={manualSources.map((item) => [item, sourceLabels[item]])} /></Field><Field label="Cidade"><Input value={form.city} onChange={(event) => set("city", event.target.value)} /></Field><Field label="Estado"><Input value={form.state} onChange={(event) => set("state", event.target.value)} /></Field><Field label="Pacote"><Filter value={form.caravanId || "none"} onChange={(value) => set("caravanId", value === "none" ? "" : value)} all="Selecione" showAll={false} items={[["none", "Sem pacote"], ...caravans.map((item) => [item.id, item.title])]} /></Field><Field label="Responsável"><Filter value={form.assignedTo || "none"} onChange={(value) => set("assignedTo", value === "none" ? "" : value)} all="Selecione" showAll={false} items={[["none", "Não atribuído"], ...owners.map((item) => [item.id, item.name])]} /></Field><Field label="Próximo contato"><Input type="datetime-local" value={form.nextFollowUpAt} onChange={(event) => set("nextFollowUpAt", event.target.value)} /></Field><div className="sm:col-span-2"><Field label="Mensagem"><Textarea rows={4} value={form.message} onChange={(event) => set("message", event.target.value)} /></Field></div></div><Button disabled={pending} onClick={save}>{pending ? "Salvando…" : "Cadastrar lead"}</Button></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
