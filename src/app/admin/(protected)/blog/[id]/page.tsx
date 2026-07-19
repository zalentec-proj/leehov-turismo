import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogPostForm } from "@/features/blog/components/blog-post-form";
import { getAdminPostById, getBlogCategories } from "@/features/blog/queries";
import { getAdminCaravans } from "@/features/caravans/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories, caravans] = await Promise.all([getAdminPostById(id), getBlogCategories(), getAdminCaravans()]);
  if (!post) notFound();
  return (
    <div className="space-y-8">
      <header>
        <Button asChild variant="ghost" className="-ml-3 mb-4 text-leehov-muted"><Link href="/admin/blog"><ChevronLeft className="size-4" />Voltar ao Blog</Link></Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h2 className="text-3xl font-extrabold text-leehov-navy-950">Editar post</h2>
          <Badge variant={post.published ? "default" : "outline"} className="self-start">{post.published ? "Publicado" : "Rascunho"}</Badge>
        </div>
        <p className="mt-2 text-sm text-leehov-muted">Última atualização: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(post.updatedAt))}</p>
      </header>
      <BlogPostForm post={post} categories={categories} caravans={caravans.map(({ id: caravanId, title, destination }) => ({ id: caravanId, title, destination }))} />
    </div>
  );
}
