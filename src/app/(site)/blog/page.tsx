import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Search } from "lucide-react";
import { getBlogCategories, getFeaturedBlogPost, getPublishedPosts } from "@/features/blog/queries";
import type { BlogPostSummary } from "@/features/blog/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewsletterSignup } from "@/features/newsletter/components/newsletter-signup";

export const metadata = {
  title: "Blog",
  description: "Inspirações, destinos e orientações para viajar em grupo com acompanhamento.",
  alternates: { canonical: "/blog" },
};

function PostCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group overflow-hidden rounded-[18px] border border-leehov-border bg-white shadow-leehov-card transition hover:-translate-y-1 hover:shadow-leehov-floating motion-reduce:transition-none">
      <div className="relative aspect-[16/10] overflow-hidden bg-leehov-surface">
        {post.imageUrl ? <Image src={post.imageUrl} alt={post.coverAltText} fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" /> : null}
      </div>
      <div className="p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leehov-blue-600">{post.category}</p>
        <h2 className="mt-3 text-xl font-extrabold leading-snug text-leehov-navy-950 transition group-hover:text-leehov-blue-600 motion-reduce:transition-none">{post.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-leehov-muted">{post.summary}</p>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold text-leehov-muted"><span>{post.author}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" aria-hidden="true" />{post.readingTime} min</span></div>
      </div>
    </Link>
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string }> }) {
  const { q = "", categoria = "" } = await searchParams;
  const [posts, categories, featured] = await Promise.all([
    getPublishedPosts({ search: q, category: categoria }),
    getBlogCategories(),
    getFeaturedBlogPost(),
  ]);
  const visibleFeatured = featured && ((!q && !categoria) || posts.some((post) => post.id === featured.id)) ? featured : null;
  const gridPosts = visibleFeatured ? posts.filter((post) => post.id !== visibleFeatured.id) : posts;

  return (
    <main className="bg-white pb-24">
      <section className="bg-leehov-navy-950 px-5 pb-32 pt-40 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1312px]">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-leehov-blue-300">Inspirações de viagem</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
            <div><h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-[-0.02em] sm:text-[58px] sm:leading-[1.08]">Histórias e orientações para viajar com mais confiança</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">Destinos, cultura, fé e o jeito Leehov de descobrir o mundo em grupo.</p></div>
            <form className="flex gap-2 rounded-[18px] border border-white/14 bg-white p-2 shadow-leehov-floating">
              <Input name="q" defaultValue={q} placeholder="Buscar por título, destino ou tema" className="h-11 border-0 text-leehov-navy-950 shadow-none" aria-label="Buscar no Blog" />
              <Button type="submit" size="icon-lg" aria-label="Buscar" className="rounded-xl bg-leehov-blue-600"><Search className="size-4" /></Button>
              {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
            </form>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-14 px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1312px] rounded-[18px] border border-leehov-border bg-white p-4 shadow-leehov-card">
          <nav aria-label="Categorias do Blog" className="flex gap-2 overflow-x-auto pb-1">
            <Button asChild size="sm" variant={!categoria ? "default" : "outline"} className="shrink-0 rounded-full"><Link href={q ? `/blog?q=${encodeURIComponent(q)}` : "/blog"}>Todos</Link></Button>
            {categories.map((category) => <Button key={category.id} asChild size="sm" variant={categoria === category.slug ? "default" : "outline"} className="shrink-0 rounded-full"><Link href={`/blog?categoria=${category.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>{category.name}</Link></Button>)}
          </nav>
        </div>
      </section>

      {visibleFeatured ? (
        <section className="px-5 py-14 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1312px]">
            <Link href={`/blog/${visibleFeatured.slug}`} className="group grid overflow-hidden rounded-[28px] bg-leehov-navy-950 shadow-leehov-floating lg:grid-cols-[1.15fr_1fr]">
              <div className="relative min-h-[340px] overflow-hidden bg-leehov-navy-800 lg:min-h-[430px]">{visibleFeatured.imageUrl ? <Image src={visibleFeatured.imageUrl} alt={visibleFeatured.coverAltText} fill unoptimized sizes="(min-width: 1024px) 57vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.025] motion-reduce:transition-none" /> : null}</div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-cyan">Destaque · {visibleFeatured.category}</p>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-[40px]">{visibleFeatured.title}</h2>
                <p className="mt-5 text-base leading-7 text-white/68">{visibleFeatured.summary}</p>
                <p className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">Ler artigo <ArrowRight className="size-4 transition group-hover:translate-x-1 motion-reduce:transition-none" /></p>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      <section className="px-5 py-12 sm:px-8 lg:px-12" aria-labelledby="blog-grid-title">
        <div className="mx-auto max-w-[1312px]">
          <div className="mb-8 flex items-end justify-between gap-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-600">Conteúdo editorial</p><h2 id="blog-grid-title" className="mt-3 text-3xl font-extrabold text-leehov-navy-950 sm:text-[40px]">Explore novas histórias</h2></div>{q || categoria ? <p className="text-sm text-leehov-muted">{posts.length} {posts.length === 1 ? "artigo encontrado" : "artigos encontrados"}</p> : null}</div>
          {gridPosts.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{gridPosts.map((post) => <PostCard key={post.id} post={post} />)}</div> : !visibleFeatured ? <div className="rounded-[24px] border border-dashed border-leehov-border bg-leehov-surface px-6 py-20 text-center"><h2 className="text-2xl font-extrabold text-leehov-navy-950">Nenhum artigo publicado</h2><p className="mt-3 text-leehov-muted">{q || categoria ? "Tente ajustar a busca ou escolher outra categoria." : "Novas inspirações serão publicadas em breve."}</p>{q || categoria ? <Button asChild variant="outline" className="mt-6 rounded-full"><Link href="/blog">Limpar busca</Link></Button> : null}</div> : null}
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1180px] gap-8 rounded-[24px] bg-leehov-surface p-7 shadow-leehov-card sm:p-10 md:grid-cols-[1fr_480px] md:items-center">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leehov-blue-600">Newsletter</p><h2 className="mt-3 text-2xl font-extrabold text-leehov-navy-950">Receba novas inspirações de viagem</h2><p className="mt-3 text-sm leading-6 text-leehov-muted">Confirme seu e-mail e acompanhe destinos, dicas e próximas caravanas.</p></div>
          <NewsletterSignup source="blog" />
        </div>
      </section>
    </main>
  );
}
