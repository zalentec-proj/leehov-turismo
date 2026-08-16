"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Edit3, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteDraftBlogPostAction, setBlogPostPublishedAction } from "@/features/blog/actions";
import { BlogActionProgress } from "@/features/blog/components/blog-action-progress";
import { formatBlogAdminDate } from "@/features/blog/date";
import type { AdminBlogListItem, BlogCategory } from "@/features/blog/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 8;

export function AdminBlogTable({ data, categories, canCreate, canUpdate, canPublish, canDeleteDraft }: { data: AdminBlogListItem[]; categories: BlogCategory[]; canCreate: boolean; canUpdate: boolean; canPublish: boolean; canDeleteDraft: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [highlight, setHighlight] = useState("all");
  const [rows, setRows] = useState(() => data);
  const [page, setPage] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ title: string; description: string } | null>(null);

  const filtered = useMemo(() => rows.filter((post) => {
    const matchesStatus = status === "all" || (status === "published" ? post.published : !post.published);
    const matchesCategory = category === "all" || post.categoryId === category;
    const matchesHighlight = highlight === "all"
      || (highlight === "featured" && (post.featuredBlog || post.featuredHome))
      || (highlight === "none" && !post.featuredBlog && !post.featuredHome)
      || (highlight === "blog" && post.featuredBlog)
      || (highlight === "home" && post.featuredHome);
    const matchesSearch = `${post.title} ${post.summary} ${post.author}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
    return matchesStatus && matchesCategory && matchesHighlight && matchesSearch;
  }), [category, highlight, query, rows, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = Boolean(query) || status !== "all" || category !== "all" || highlight !== "all";

  const runAction = useCallback(async (
    id: string,
    title: string,
    action: () => Promise<{ success: boolean; message: string }>,
    updateRows: (currentRows: AdminBlogListItem[]) => AdminBlogListItem[],
  ) => {
    setActionId(id);
    setProgress({ title, description: "Aguarde enquanto atualizamos o artigo e recarregamos os dados do Blog." });
    try {
      const result = await action();
      if (result.success) {
        setRows(updateRows);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Não foi possível concluir a ação. Atualize a página e tente novamente.");
    } finally {
      setActionId(null);
      setProgress(null);
    }
  }, []);

  const changePage = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const pending = actionId !== null;

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setCategory("all");
    setHighlight("all");
    setPage(0);
  }

  return (
    <div className="space-y-5">
      <BlogActionProgress open={Boolean(progress)} title={progress?.title ?? "Processando..."} description={progress?.description ?? "Aguarde a conclusão desta etapa."} />
      <div className="grid gap-3 rounded-[18px] border border-leehov-border bg-white p-4 shadow-sm lg:grid-cols-[minmax(260px,1fr)_repeat(3,190px)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-leehov-muted" />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Buscar por título, resumo ou autora" className="pl-9" aria-label="Buscar posts" />
        </div>
        <Select value={category} onValueChange={(value) => { setCategory(value); setPage(0); }}><SelectTrigger aria-label="Filtrar por categoria"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={(value) => { setStatus(value); setPage(0); }}><SelectTrigger aria-label="Filtrar por status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="draft">Rascunhos</SelectItem><SelectItem value="published">Publicados</SelectItem></SelectContent></Select>
        <Select value={highlight} onValueChange={(value) => { setHighlight(value); setPage(0); }}><SelectTrigger aria-label="Filtrar por destaque"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os destaques</SelectItem><SelectItem value="featured">Com destaque</SelectItem><SelectItem value="none">Sem destaque</SelectItem><SelectItem value="blog">Destaque no Blog</SelectItem><SelectItem value="home">Destaque na Home</SelectItem></SelectContent></Select>
        {hasFilters ? <Button type="button" variant="ghost" onClick={clearFilters}><X className="size-4" />Limpar</Button> : <span />}
      </div>

      <Card className="overflow-hidden rounded-[18px] border-leehov-border p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-leehov-surface/80"><TableHead className="h-12 text-xs font-bold uppercase tracking-[0.08em] text-leehov-muted">Post</TableHead><TableHead className="h-12 text-xs font-bold uppercase tracking-[0.08em] text-leehov-muted">Categoria</TableHead><TableHead className="h-12 text-xs font-bold uppercase tracking-[0.08em] text-leehov-muted">Status</TableHead><TableHead className="h-12 text-xs font-bold uppercase tracking-[0.08em] text-leehov-muted">Destaques</TableHead><TableHead className="h-12 text-xs font-bold uppercase tracking-[0.08em] text-leehov-muted">Atualizado</TableHead><TableHead className="h-12 text-xs font-bold uppercase tracking-[0.08em] text-leehov-muted">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {pageRows.map((post) => <TableRow key={post.id} className="h-[88px]"><TableCell><div className="flex min-w-[330px] items-center gap-4"><div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-leehov-surface">{post.imageUrl ? <Image src={post.imageUrl} alt="" fill unoptimized sizes="64px" className="object-cover" /> : null}</div><div className="min-w-0"><p className="line-clamp-2 font-extrabold leading-5 text-leehov-navy-950">{post.title}</p><p className="mt-1 text-xs text-leehov-muted">{post.author} · {post.readingTime} min</p></div></div></TableCell><TableCell><span className="whitespace-nowrap text-sm font-medium text-leehov-text">{post.category}</span></TableCell><TableCell><Badge variant={post.published ? "default" : "outline"}>{post.published ? "Publicado" : "Rascunho"}</Badge></TableCell><TableCell><div className="flex min-w-24 flex-wrap gap-1.5">{post.featuredBlog ? <Badge className="bg-leehov-blue-600">Blog</Badge> : null}{post.featuredHome ? <Badge variant="secondary">Home</Badge> : null}{!post.featuredBlog && !post.featuredHome ? <span className="text-xs text-leehov-muted">Nenhum</span> : null}</div></TableCell><TableCell><time dateTime={post.updatedAt} className="whitespace-nowrap text-xs text-leehov-muted">{formatBlogAdminDate(post.updatedAt)}</time></TableCell><TableCell><div className="flex min-w-[210px] justify-end gap-2">{canPublish ? <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => runAction(post.id, post.published ? "Despublicando artigo..." : "Publicando artigo...", () => setBlogPostPublishedAction(post.id, !post.published), (currentRows) => currentRows.map((item) => item.id === post.id ? { ...item, published: !post.published, featuredHome: post.published ? false : item.featuredHome, featuredBlog: post.published ? false : item.featuredBlog, updatedAt: new Date().toISOString() } : item))}>{pending && actionId === post.id ? <Loader2 className="size-3.5 animate-spin" /> : null}{post.published ? "Despublicar" : "Publicar"}</Button> : null}{canUpdate ? <Button asChild variant="ghost" size="icon"><Link href={`/admin/blog/${post.id}`} aria-label={`Editar ${post.title}`}><Edit3 className="size-4" /></Link></Button> : null}{canDeleteDraft && !post.published ? <Button type="button" variant="ghost" size="icon" aria-label={`Excluir ${post.title}`} disabled={pending} onClick={() => { if (!window.confirm(`Excluir definitivamente o rascunho “${post.title}” e suas imagens?`)) return; runAction(post.id, "Excluindo rascunho...", () => deleteDraftBlogPostAction(post.id), (currentRows) => currentRows.filter((item) => item.id !== post.id)); }}><Trash2 className="size-4 text-destructive" /></Button> : null}</div></TableCell></TableRow>)}
              {!pageRows.length ? <TableRow><TableCell colSpan={6} className="h-48 text-center"><p className="font-bold text-leehov-navy-950">Nenhum post encontrado</p><p className="mt-2 text-sm text-leehov-muted">Ajuste os filtros ou crie um novo conteúdo.</p>{canCreate ? <Button asChild className="mt-5 rounded-full"><Link href="/admin/blog/novo"><Plus className="size-4" />Novo post</Link></Button> : null}</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </div>
        <footer className="flex flex-col gap-3 border-t border-leehov-border px-5 py-4 text-sm text-leehov-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{filtered.length} {filtered.length === 1 ? "post" : "posts"} · página {page + 1} de {pageCount}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page === 0 || pending} onClick={() => changePage(Math.max(0, page - 1))}><ChevronLeft className="size-4" />Anterior</Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= pageCount - 1 || pending} onClick={() => changePage(Math.min(pageCount - 1, page + 1))}>Próxima<ChevronRight className="size-4" /></Button>
          </div>
        </footer>
      </Card>
    </div>
  );
}
