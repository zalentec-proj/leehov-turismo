"use client";

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EmailLog } from "@/features/emails/types";
import type { NewsletterStatus, NewsletterSubscriber } from "@/features/newsletter/types";

const subscriberColumn = createColumnHelper<NewsletterSubscriber>();
const logColumn = createColumnHelper<EmailLog>();
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const statusLabels: Record<NewsletterStatus, string> = { pending: "Pendente", active: "Ativo", unsubscribed: "Cancelado" };

export function AdminNewsletterTable({ subscribers, logs }: { subscribers: NewsletterSubscriber[]; logs: EmailLog[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const sources = useMemo(() => Array.from(new Set(subscribers.map((item) => item.source))).sort(), [subscribers]);
  const filtered = useMemo(() => subscribers.filter((item) =>
    (status === "all" || item.status === status) &&
    (source === "all" || item.source === source) &&
    `${item.name} ${item.email}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))
  ), [query, source, status, subscribers]);
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

  return <Tabs defaultValue="subscribers" className="space-y-5"><TabsList><TabsTrigger value="subscribers">Inscritos</TabsTrigger><TabsTrigger value="logs">Logs de e-mail</TabsTrigger></TabsList><TabsContent value="subscribers" className="space-y-5"><div className="grid gap-3 md:grid-cols-[1fr_180px_200px]"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou e-mail" /><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={source} onValueChange={setSource}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as origens</SelectItem>{sources.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><DataTable table={subscriberTable} columnCount={subscriberColumns.length} empty="Nenhum inscrito encontrado." /></TabsContent><TabsContent value="logs"><DataTable table={logTable} columnCount={logColumns.length} empty="Nenhuma tentativa de e-mail registrada." /></TabsContent></Tabs>;
}

function DataTable<T>({ table, columnCount, empty }: { table: ReturnType<typeof useReactTable<T>>; columnCount: number; empty: string }) {
  return <Card className="overflow-hidden rounded-[18px] border-leehov-border p-0"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}{!table.getRowModel().rows.length ? <TableRow><TableCell colSpan={columnCount} className="h-32 text-center text-leehov-muted">{empty}</TableCell></TableRow> : null}</TableBody></Table></div></Card>;
}
