import { demoPosts } from "@/data/demo-content";
import type { BlogPostDetail, BlogPostSummary } from "@/features/blog/types";

export async function getFeaturedPosts(): Promise<BlogPostSummary[]> {
  return demoPosts;
}

export async function getPublishedPosts(): Promise<BlogPostSummary[]> {
  return demoPosts;
}

export async function getPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const post = demoPosts.find((item) => item.slug === slug);

  if (!post) {
    return null;
  }

  return {
    ...post,
    author: "Equipe Leehov",
    publishedAt: "2026-07-01",
    content:
      "Este post inicial serve como estrutura de leitura. O conteudo final sera migrado do WordPress e gerenciado pelo painel administrativo.",
  };
}
