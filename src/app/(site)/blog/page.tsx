import Link from "next/link";
import { SectionHeading } from "@/components/leehov/shared/section-heading";
import { getPublishedPosts } from "@/features/blog/queries";

export const metadata = {
  title: "Blog",
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <section className="bg-leehov-surface px-5 pb-20 pt-40 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Inspirações de viagem"
          title="Blog Leehov"
          description="Hub editorial preparado para busca, categorias, posts em destaque e conteudos relacionados a caravanas."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="overflow-hidden rounded-[18px] border border-leehov-border bg-white shadow-leehov-card">
              <div className="h-52 bg-cover bg-center" style={{ backgroundImage: `url(${post.imageUrl})` }} />
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">
                  {post.category}
                </p>
                <h2 className="mt-3 text-xl font-bold text-leehov-navy-950">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-leehov-muted">
                  {post.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
