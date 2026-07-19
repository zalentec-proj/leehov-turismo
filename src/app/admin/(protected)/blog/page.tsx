import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AdminBlogTable } from "@/features/blog/components/admin-blog-table";
import { BlogCategoryManager } from "@/features/blog/components/blog-category-manager";
import { getAdminPosts, getBlogCategories } from "@/features/blog/queries";
import { requireActiveProfile } from "@/features/auth/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function AdminBlogPage() {
  await requireActiveProfile();
  const [posts, categories] = await Promise.all([getAdminPosts(), getBlogCategories()]);
  const publishedCount = posts.filter((post) => post.published).length;
  const featuredCount = posts.filter((post) => post.featuredBlog || post.featuredHome).length;
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Conteúdo editorial</p>
          <h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Blog</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-leehov-muted">Crie artigos, organize categorias, relacione destinos e controle a publicação sem expor rascunhos.</p>
        </div>
        <Button asChild size="lg" className="self-start rounded-full bg-leehov-blue-600 px-6 text-white hover:bg-leehov-cyan lg:self-auto"><Link href="/admin/blog/novo"><Plus className="size-4" />Novo post</Link></Button>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-[18px] border-leehov-border p-5"><p className="text-xs font-bold uppercase tracking-[0.1em] text-leehov-muted">Total de posts</p><p className="mt-2 text-3xl font-extrabold text-leehov-navy-950">{posts.length}</p></Card>
        <Card className="rounded-[18px] border-leehov-border p-5"><p className="text-xs font-bold uppercase tracking-[0.1em] text-leehov-muted">Publicados</p><p className="mt-2 text-3xl font-extrabold text-leehov-navy-950">{publishedCount}</p></Card>
        <Card className="rounded-[18px] border-leehov-border p-5"><p className="text-xs font-bold uppercase tracking-[0.1em] text-leehov-muted">Com destaque</p><div className="mt-2 flex items-center gap-3"><p className="text-3xl font-extrabold text-leehov-navy-950">{featuredCount}</p><FileText className="size-5 text-leehov-blue-500" /></div></Card>
      </div>
      <AdminBlogTable data={posts} categories={categories} />
      <BlogCategoryManager categories={categories} />
    </div>
  );
}
