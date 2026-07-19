import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BlogPostForm } from "@/features/blog/components/blog-post-form";
import { getBlogCategories } from "@/features/blog/queries";
import { getAdminCaravans } from "@/features/caravans/queries";
import { Button } from "@/components/ui/button";

export default async function NewBlogPostPage() {
  const [categories, caravans] = await Promise.all([getBlogCategories(), getAdminCaravans()]);
  return (
    <div className="space-y-8">
      <header>
        <Button asChild variant="ghost" className="-ml-3 mb-4 text-leehov-muted"><Link href="/admin/blog"><ChevronLeft className="size-4" />Voltar ao Blog</Link></Button>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Blog · Novo conteúdo</p>
        <h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Novo post</h2>
        <p className="mt-2 text-sm text-leehov-muted">Comece pelo conteúdo e salve o rascunho antes de enviar imagens.</p>
      </header>
      <BlogPostForm categories={categories} caravans={caravans.map(({ id, title, destination }) => ({ id, title, destination }))} />
    </div>
  );
}
