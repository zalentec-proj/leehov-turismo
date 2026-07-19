"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Edit3, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setCaravanPublishedAction } from "@/features/caravans/actions";
import type { AdminCaravan } from "@/features/caravans/types";
import { StatusBadge } from "@/components/leehov/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const columnHelper = createColumnHelper<AdminCaravan>();

export function AdminCaravansTable({ data }: { data: AdminCaravan[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => data.filter((item) => (status === "all" || item.status === status) && `${item.title} ${item.destination} ${item.category?.name ?? ""}`.toLowerCase().includes(query.toLowerCase())), [data, query, status]);

  const columns = useMemo(() => [
    columnHelper.accessor("title", { header: "Caravana", cell: ({ row }) => <div className="flex min-w-[260px] items-center gap-3"><div className="size-14 shrink-0 rounded-xl bg-leehov-surface bg-cover bg-center" style={{ backgroundImage: row.original.imageUrl ? `url(${row.original.imageUrl})` : undefined }} /><div><p className="font-bold text-leehov-navy-950">{row.original.title}</p><p className="text-xs text-leehov-muted">{row.original.destination}</p></div></div> }),
    columnHelper.display({ id: "category", header: "Categoria", cell: ({ row }) => row.original.category?.name ?? "—" }),
    columnHelper.display({ id: "departure", header: "Próxima saída", cell: ({ row }) => <div><p>{row.original.departureLabel}</p><p className="text-xs text-leehov-muted">{row.original.duration}</p></div> }),
    columnHelper.accessor("status", { header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> }),
    columnHelper.display({ id: "featured", header: "Destaques", cell: ({ row }) => <div className="flex gap-1">{row.original.featuredHero ? <Badge>Hero</Badge> : null}{row.original.featuredHome ? <Badge variant="secondary">Home</Badge> : null}</div> }),
    columnHelper.display({ id: "publication", header: "Publicação", cell: ({ row }) => <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => { const result = await setCaravanPublishedAction(row.original.id, !row.original.published); if (result.success) toast.success(result.message); else toast.error(result.message); router.refresh(); })}>{pending ? <Loader2 className="size-3 animate-spin" /> : null}{row.original.published ? "Despublicar" : "Publicar"}</Button> }),
    columnHelper.display({ id: "actions", header: "", cell: ({ row }) => <Button asChild variant="ghost" size="icon"><Link href={`/admin/caravanas/${row.original.id}`} aria-label={`Editar ${row.original.title}`}><Edit3 className="size-4" /></Link></Button> }),
  ], [pending, router]);
  // TanStack Table intentionally exposes non-memoizable functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: filtered, columns, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel() });

  return <div className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-1 gap-3"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por caravana, destino ou categoria" className="max-w-lg" /><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="available">Disponível</SelectItem><SelectItem value="coming_soon">Em breve</SelectItem><SelectItem value="waitlist">Lista de espera</SelectItem><SelectItem value="sold_out">Esgotada</SelectItem></SelectContent></Select></div><Button asChild className="rounded-full bg-leehov-blue-600 text-white"><Link href="/admin/caravanas/novo"><Plus className="size-4" />Nova caravana</Link></Button></div><Card className="overflow-hidden rounded-[18px] border-leehov-border p-0"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}{!table.getRowModel().rows.length ? <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-leehov-muted">Nenhuma caravana encontrada.</TableCell></TableRow> : null}</TableBody></Table></div></Card></div>;
}
