import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogPhotoGallery } from "@/features/blog/components/blog-photo-gallery";
import { getPostBySlug, getRelatedPosts } from "@/features/blog/queries";
import { Button } from "@/components/ui/button";
import { NewsletterSignup } from "@/features/newsletter/components/newsletter-signup";
import { LEEHOV_WHATSAPP_URL } from "@/features/settings/utils";

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.summary;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: post.imageUrl ? [{ url: post.imageUrl, alt: post.coverAltText }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post);
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(post.publishedAt));
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    image: post.imageUrl || undefined,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "Leehov Turismo" },
    mainEntityOfPage: `/blog/${post.slug}`,
  };

  return (
    <article className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replaceAll("<", "\\u003c") }} />

      <header className="bg-leehov-navy-950 px-5 pb-40 pt-36 text-white sm:px-8 sm:pb-48 sm:pt-40 lg:px-12">
        <div className="mx-auto max-w-[930px] text-center">
          <Button asChild variant="ghost" className="mb-8 rounded-full text-white/72 hover:bg-white/10 hover:text-white">
            <Link href="/blog">
              <ArrowLeft className="size-4" />
              Voltar ao Blog
            </Link>
          </Button>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-300">{post.category}</p>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[52px] lg:text-[64px]">
            {post.title}
          </h1>
          <p className="mx-auto mt-6 max-w-[690px] text-base leading-7 text-white/72 sm:text-lg sm:leading-8">{post.summary}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/62">
            <span className="font-bold text-white">{post.author}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true" />{date}</span>
            <span className="inline-flex items-center gap-2"><Clock3 className="size-4" aria-hidden="true" />{post.readingTime} min de leitura</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto -mt-28 max-w-[1312px] px-5 sm:-mt-32 sm:px-8 lg:px-0">
        <div className="relative aspect-[16/8] overflow-hidden rounded-[24px] bg-leehov-surface shadow-leehov-floating sm:aspect-[16/6] lg:h-[408px] lg:aspect-auto">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.coverAltText}
              fill
              priority
              unoptimized
              sizes="(min-width: 1312px) 1312px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-leehov-sky to-leehov-border text-sm font-semibold text-leehov-muted">
              Capa em preparação
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[740px] px-5 pb-12 pt-16 sm:px-8 sm:pt-20">
        <div
          className="blog-content text-[17px] leading-8 text-leehov-text [&_a]:font-semibold [&_a]:text-leehov-blue-600 [&_a]:underline-offset-4 [&_a:hover]:underline [&_blockquote]:my-9 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-leehov-cyan [&_blockquote]:bg-leehov-surface [&_blockquote]:p-6 [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:text-[30px] [&_h2]:font-extrabold [&_h2]:leading-tight [&_h2]:text-leehov-navy-950 [&_h3]:mb-3 [&_h3]:mt-9 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-leehov-navy-950 [&_li]:my-2 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-7 [&_p]:my-6 [&_strong]:text-leehov-navy-950 [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-7"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      <BlogPhotoGallery images={post.images} />

      {post.relatedCaravan?.published ? (
        <aside className="bg-white px-5 pb-20 pt-2 sm:px-8 lg:px-12 lg:pb-24">
          <div className="mx-auto flex min-h-[206px] max-w-[1312px] flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-leehov-navy-950 via-leehov-navy-800 to-leehov-blue-600 p-8 text-white shadow-leehov-floating sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:px-14">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-300">Caravana relacionada</p>
              <h2 className="mt-3 text-[30px] font-extrabold leading-tight">{post.relatedCaravan.title}</h2>
              <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base">Transforme a inspiração em uma experiência em grupo acompanhada pela Leehov.</p>
            </div>
            <Button asChild size="lg" className="mt-7 self-start rounded-full bg-white px-6 text-leehov-navy-950 hover:bg-leehov-surface lg:mt-0 lg:self-auto">
              <Link href={`/caravanas/${post.relatedCaravan.slug}`}>Ver caravana <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </aside>
      ) : null}

      {related.length ? (
        <section className="border-t border-leehov-border bg-leehov-surface px-5 py-20 sm:px-8 lg:px-12" aria-labelledby="related-posts-title">
          <div className="mx-auto max-w-[1312px]">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-600">Mais inspirações</p>
                <h2 id="related-posts-title" className="mt-3 text-3xl font-extrabold text-leehov-navy-950 sm:text-[40px]">Continue explorando</h2>
              </div>
              <Button asChild variant="outline" className="hidden rounded-full sm:inline-flex"><Link href="/blog">Ver todos</Link></Button>
            </div>
            <div className="mt-9 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={`/blog/${item.slug}`} className="group overflow-hidden rounded-[18px] border border-leehov-border bg-white shadow-leehov-card">
                  <div className="relative aspect-[16/10] overflow-hidden bg-leehov-sky">
                    {item.imageUrl ? <Image src={item.imageUrl} alt={item.coverAltText} fill unoptimized sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.035] motion-reduce:transition-none" /> : null}
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leehov-blue-600">{item.category}</p>
                    <h3 className="mt-3 text-xl font-extrabold leading-snug text-leehov-navy-950 transition group-hover:text-leehov-blue-600 motion-reduce:transition-none">{item.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-leehov-muted">{item.summary}</p>
                    {item.relatedDestination ? <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-leehov-muted"><MapPin className="size-3.5" aria-hidden="true" />{item.relatedDestination}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <aside className="bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1080px] gap-8 rounded-[24px] bg-leehov-navy-950 p-8 text-white shadow-leehov-floating sm:p-10 lg:grid-cols-[1fr_480px] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leehov-blue-300">Próxima viagem</p>
            <h2 className="mt-3 text-3xl font-extrabold">Continue viajando com a Leehov</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Receba novos conteúdos e próximas caravanas após confirmar seu e-mail.</p>
          </div>
          <NewsletterSignup source="blog_post" variant="dark" />
        </div>
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-leehov-navy-950">Quer conversar sobre sua próxima viagem?</h2>
          <p className="mx-auto mt-4 max-w-xl text-leehov-muted">A equipe Leehov ajuda você a encontrar uma caravana com o acompanhamento certo.</p>
          <Button asChild size="lg" className="mt-7 rounded-full bg-leehov-blue-600 px-6 text-white"><a href={LEEHOV_WHATSAPP_URL} target="_blank" rel="noreferrer">Falar com um consultor</a></Button>
        </div>
      </aside>
    </article>
  );
}
