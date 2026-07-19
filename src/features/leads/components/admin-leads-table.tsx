"use client";

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Eye, Loader2, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateLeadStatusAction } from "@/features/leads/actions";
import type { AdminLead, LeadSource, LeadStatus } from "@/features/leads/types";

const statusLabels: Record<LeadStatus, string> = { new: "Novo", in_progress: "Em atendimento", converted: "Convertido", archived: "Arquivado" };
const sourceLabels: Record<LeadSource, string> = { contact: "Contato", caravan_interest: "Interesse em caravana", popup: "Pop-up" };
const columnHelper = createColumnHelper<AdminLead>();
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function leadWhatsappUrl(lead: AdminLead) {
  const digits = lead.phone.replace(/\D/g, "");
  const message = lead.caravan ? `Olá, ${lead.name}. Recebemos seu interesse na caravana ${lead.caravan.title}.` : `Olá, ${lead.name}. Recebemos sua mensagem pelo site da Leehov.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function AdminLeadsTable({ data }: { data: AdminLead[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [caravan, setCaravan] = useState("all");
  const [selected, setSelected] = useState<AdminLead | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const caravans = useMemo(() => Array.from(new Map(data.filter((lead) => lead.caravan).map((lead) => [lead.caravan!.id, lead.caravan!])).values()), [data]);
  const filtered = useMemo(() => data.filter((lead) =>
    (status === "all" || lead.status === status) &&
    (source === "all" || lead.source === source) &&
    (caravan === "all" || lead.caravanId === caravan) &&
    `${lead.name} ${lead.email} ${lead.phone}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))
  ), [caravan, data, query, source, status]);

  const changeStatus = useCallback((lead: AdminLead, nextStatus: LeadStatus) => {
    setPendingId(lead.id);
    startTransition(async () => {
      const result = await updateLeadStatusAction(lead.id, nextStatus);
      if (result.success) toast.success(result.message); else toast.error(result.message);
      setPendingId(null);
      router.refresh();
    });
  }, [router]);

  const columns = useMemo(() => [
    columnHelper.accessor("name", { header: "Lead", cell: ({ row }) => <div className="min-w-[210px]"><p className="font-bold text-leehov-navy-950">{row.original.name}</p><p className="text-xs text-leehov-muted">{row.original.email}</p><p className="text-xs text-leehov-muted">{row.original.phone}</p></div> }),
    columnHelper.accessor("source", { header: "Origem", cell: ({ getValue }) => <Badge variant="outline">{sourceLabels[getValue()]}</Badge> }),
    columnHelper.display({ id: "caravan", header: "Caravana", cell: ({ row }) => row.original.caravan?.title ?? "—" }),
    columnHelper.accessor("createdAt", { header: "Recebido em", cell: ({ getValue }) => <span className="whitespace-nowrap text-sm">{dateFormatter.format(new Date(getValue()))}</span> }),
    columnHelper.accessor("status", { header: "Status", cell: ({ row }) => <Select value={row.original.status} disabled={pendingId === row.original.id} onValueChange={(value) => changeStatus(row.original, value as LeadStatus)}><SelectTrigger className="w-[165px]"><SelectValue />{pendingId === row.original.id ? <Loader2 className="size-3 animate-spin" /> : null}</SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select> }),
    columnHelper.display({ id: "actions", header: "", cell: ({ row }) => <div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon"><a href={leadWhatsappUrl(row.original)} target="_blank" rel="noreferrer" aria-label={`Conversar com ${row.original.name} no WhatsApp`}><MessageCircle className="size-4" /></a></Button><Button type="button" variant="ghost" size="icon" onClick={() => setSelected(row.original)} aria-label={`Ver detalhes de ${row.original.name}`}><Eye className="size-4" /></Button></div> }),
  ], [changeStatus, pendingId]);
  // TanStack Table intentionally exposes non-memoizable functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: filtered, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_210px_220px]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, e-mail ou WhatsApp" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={source} onValueChange={setSource}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as origens</SelectItem>{Object.entries(sourceLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={caravan} onValueChange={setCaravan}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as caravanas</SelectItem>{caravans.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select>
      </div>
      <Card className="overflow-hidden rounded-[18px] border-leehov-border p-0"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}{!table.getRowModel().rows.length ? <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-leehov-muted">Nenhum lead encontrado.</TableCell></TableRow> : null}</TableBody></Table></div></Card>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">{selected ? <><DialogHeader><DialogTitle>{selected.name}</DialogTitle><DialogDescription>Lead recebido em {dateFormatter.format(new Date(selected.createdAt))}.</DialogDescription></DialogHeader><div className="grid gap-5 text-sm"><div className="grid gap-3 rounded-xl bg-leehov-surface p-4 sm:grid-cols-2"><p><strong>E-mail</strong><br />{selected.email}</p><p><strong>WhatsApp</strong><br />{selected.phone}</p>{selected.city ? <p><strong>Cidade</strong><br />{selected.city}/{selected.state}</p> : null}<p><strong>Origem</strong><br />{sourceLabels[selected.source]}</p>{selected.caravan ? <p className="sm:col-span-2"><strong>Caravana</strong><br />{selected.caravan.title}</p> : null}</div><div><p className="font-bold text-leehov-navy-950">Mensagem</p><p className="mt-2 whitespace-pre-wrap leading-6 text-leehov-muted">{selected.message}</p></div><div><p className="font-bold text-leehov-navy-950">Atribuição</p><p className="mt-2 break-words leading-6 text-leehov-muted">Página: {selected.metadata.pagePath || "—"}<br />Referência: {selected.metadata.referrer || "—"}<br />UTM: {[selected.metadata.utmSource, selected.metadata.utmMedium, selected.metadata.utmCampaign].filter(Boolean).join(" / ") || "—"}</p></div><Button asChild className="rounded-full bg-emerald-600 text-white"><a href={leadWhatsappUrl(selected)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" />Conversar no WhatsApp</a></Button></div></> : null}</DialogContent></Dialog>
    </div>
  );
}
