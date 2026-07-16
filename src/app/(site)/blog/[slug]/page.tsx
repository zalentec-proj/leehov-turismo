import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/features/blog/queries";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="bg-white px-5 pb-20 pt-40 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">
          {post.category}
        </p>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight text-leehov-navy-950 sm:text-6xl">
          {post.title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-leehov-muted">{post.summary}</p>
        <div className="mt-8 h-[380px] rounded-[28px] bg-cover bg-center shadow-leehov-floating" style={{ backgroundImage: `url(${post.imageUrl})` }} />
        <div className="prose prose-slate mt-10 max-w-none">
          <p>{post.content}</p>
        </div>
      </div>
    </article>
  );
}
