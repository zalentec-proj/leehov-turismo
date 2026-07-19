"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Edit3, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteDraftBlogPostAction, setBlogPostPublishedAction } from "@/features/blog/actions";
import type { AdminBlogPost, BlogCategory } from "@/features/blog/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const columnHelper = createColumnHelper<AdminBlogPost>();
const PAGE_SIZE = 8;

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function AdminBlogTable({ data, categories }: { data: AdminBlogPost[]; categories: BlogCategory[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [highlight, setHighlight] = useState("all");
  const [page, setPage] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => data.filter((post) => {
    const matchesStatus = status === "all" || (status === "published" ? post.published : !post.published);
    const matchesCategory = category === "all" || post.categoryId === category;
    const matchesHighlight = highlight === "all"
      || (highlight === "featured" && (post.featuredBlog || post.featuredHome))
      || (highlight === "none" && !post.featuredBlog && !post.featuredHome)
      || (highlight === "blog" && post.featuredBlog)
      || (highlight === "home" && post.featuredHome);
    const matchesSearch = `${post.title} ${post.summary} ${post.author}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
    return matchesStatus && matchesCategory && matchesHighlight && matchesSearch;
  }), [category, data, highlight, query, status]);

  useEffect(() => setPage(0), [category, highlight, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = Boolean(query) || status !== "all" || category !== "all" || highlight !== "all";

  const runAction = useCallback((id: string, action: () => Promise<{ success: boolean; message: string }>) => {
    setActionId(id);
    startTransition(async () => {
      const result = await action();
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      setActionId(null);
      router.refresh();
    });
  }, [router]);

  const columns = useMemo(() => [
    columnHelper.accessor("title", {
      header: "Post",
      cell: ({ row }) => (
        <div className="flex min-w-[330px] items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-leehov-surface">
            {row.original.imageUrl ? <Image src={row.original.imageUrl} alt="" fill unoptimized sizes="64px" className="object-cover" /> : null}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 font-extrabold leading-5 text-leehov-navy-950">{row.original.title}</p>
            <p className="mt-1 text-xs text-leehov-muted">{row.original.author} · {row.original.readingTime} min</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("category", { header: "Categoria", cell: ({ getValue }) => <span className="whitespace-nowrap text-sm font-medium text-leehov-text">{getValue()}</span> }),
    columnHelper.display({ id: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.published ? "default" : "outline"}>{row.original.published ? "Publicado" : "Rascunho"}</Badge> }),
    columnHelper.display({
      id: "featured",
      header: "Destaques",
      cell: ({ row }) => (
        <div className="flex min-w-24 flex-wrap gap-1.5">
          {row.original.featuredBlog ? <Badge className="bg-leehov-blue-600">Blog</Badge> : null}
          {row.original.featuredHome ? <Badge variant="secondary">Home</Badge> : null}
          {!row.original.featuredBlog && !row.original.featuredHome ? <span className="text-xs text-leehov-muted">Nenhum</span> : null}
        </div>
      ),
    }),
    columnHelper.accessor("updatedAt", { header: "Atualizado", cell: ({ getValue }) => <time dateTime={getValue()} className="whitespace-nowrap text-xs text-leehov-muted">{formatUpdatedAt(getValue())}</time> }),
    columnHelper.display({
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex min-w-[210px] justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => runAction(row.original.id, () => setBlogPostPublishedAction(row.original.id, !row.original.published))}
          >
            {pending && actionId === row.original.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {row.original.published ? "Despublicar" : "Publicar"}
          </Button>
          <Button asChild variant="ghost" size="icon"><Link href={`/admin/blog/${row.original.id}`} aria-label={`Editar ${row.original.title}`}><Edit3 className="size-4" /></Link></Button>
          {!row.original.published ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${row.original.title}`}
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Excluir definitivamente o rascunho “${row.original.title}” e suas imagens?`)) return;
                runAction(row.original.id, () => deleteDraftBlogPostAction(row.original.id));
              }}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      ),
    }),
  ], [actionId, pending, runAction]);

  // TanStack Table intentionally exposes non-memoizable functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: pageRows, columns, getCoreRowModel: getCoreRowModel() });

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setCategory("all");
    setHighlight("all");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-[18px] border border-leehov-border bg-white p-4 shadow-sm lg:grid-cols-[minmax(260px,1fr)_repeat(3,190px)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-leehov-muted" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, resumo ou autora" className="pl-9" aria-label="Buscar posts" />
        </div>
        <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Filtrar por categoria"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filtrar por status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="draft">Rascunhos</SelectItem><SelectItem value="published">Publicados</SelectItem></SelectContent></Select>
        <Select value={highlight} onValueChange={setHighlight}><SelectTrigger aria-label="Filtrar por destaque"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os destaques</SelectItem><SelectItem value="featured">Com destaque</SelectItem><SelectItem value="none">Sem destaque</SelectItem><SelectItem value="blog">Destaque no Blog</SelectItem><SelectItem value="home">Destaque na Home</SelectItem></SelectContent></Select>
        {hasFilters ? <Button type="button" variant="ghost" onClick={clearFilters}><X className="size-4" />Limpar</Button> : <span />}
      </div>

      <Card className="overflow-hidden rounded-[18px] border-leehov-border p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id} className="bg-leehov-surface/80">{group.headers.map((header) => <TableHead key={header.id} className="h-12 text-xs font-bold uppercase tracking-[0.08em] text-leehov-muted">{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => <TableRow key={row.id} className="h-[88px]">{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}
              {!table.getRowModel().rows.length ? <TableRow><TableCell colSpan={columns.length} className="h-48 text-center"><p className="font-bold text-leehov-navy-950">Nenhum post encontrado</p><p className="mt-2 text-sm text-leehov-muted">Ajuste os filtros ou crie um novo conteúdo.</p><Button asChild className="mt-5 rounded-full"><Link href="/admin/blog/novo"><Plus className="size-4" />Novo post</Link></Button></TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </div>
        <footer className="flex flex-col gap-3 border-t border-leehov-border px-5 py-4 text-sm text-leehov-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{filtered.length} {filtered.length === 1 ? "post" : "posts"} · página {page + 1} de {pageCount}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}><ChevronLeft className="size-4" />Anterior</Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Próxima<ChevronRight className="size-4" /></Button>
          </div>
        </footer>
      </Card>
    </div>
  );
}
