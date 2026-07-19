import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapAdminBlogPost, mapBlogDetail, mapBlogSummary, type BlogQueryRow } from "@/features/blog/mappers";
import type { AdminBlogPost, BlogCategory, BlogPostDetail, BlogPostSummary } from "@/features/blog/types";

const blogSelect = `
  *,
  category:blog_categories (*),
  images:blog_post_images (*),
  relatedCaravan:caravans (id, title, slug, published)
`;

export async function getPublishedPosts(options: { search?: string; category?: string } = {}): Promise<BlogPostSummary[]> {
  const supabase = await createClient();
  const query = supabase.from("blog_posts").select(blogSelect).eq("published", true).order("published_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar o Blog: ${error.message}`);
  const rows = (data ?? []) as unknown as BlogQueryRow[];
  const search = options.search?.trim().toLocaleLowerCase("pt-BR");
  const categoryFiltered = options.category ? rows.filter((row) => row.category?.slug === options.category) : rows;
  const filtered = search ? categoryFiltered.filter((row) => `${row.title} ${row.summary ?? ""} ${row.related_destination ?? ""}`.toLocaleLowerCase("pt-BR").includes(search)) : categoryFiltered;
  return Promise.all(filtered.map((row) => mapBlogSummary(supabase, row)));
}

export async function getFeaturedPosts(): Promise<BlogPostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts").select(blogSelect).eq("published", true).eq("featured_home", true).order("published_at", { ascending: false }).limit(3);
  if (error) throw new Error(`Não foi possível carregar os destaques do Blog: ${error.message}`);
  return Promise.all(((data ?? []) as unknown as BlogQueryRow[]).map((row) => mapBlogSummary(supabase, row)));
}

export async function getFeaturedBlogPost(): Promise<BlogPostSummary | null> {
  const supabase = await createClient();
  const { data: featured, error } = await supabase.from("blog_posts").select(blogSelect).eq("published", true).eq("featured_blog", true).order("published_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o destaque editorial: ${error.message}`);
  if (featured) return mapBlogSummary(supabase, featured as unknown as BlogQueryRow);
  const { data: latest, error: latestError } = await supabase.from("blog_posts").select(blogSelect).eq("published", true).order("published_at", { ascending: false }).limit(1).maybeSingle();
  if (latestError) throw new Error(`Não foi possível carregar o destaque editorial: ${latestError.message}`);
  return latest ? mapBlogSummary(supabase, latest as unknown as BlogQueryRow) : null;
}

export async function getPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts").select(blogSelect).eq("slug", slug).eq("published", true).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o artigo: ${error.message}`);
  return data ? mapBlogDetail(supabase, data as unknown as BlogQueryRow) : null;
}

export async function getRelatedPosts(post: BlogPostDetail, limit = 3): Promise<BlogPostSummary[]> {
  const supabase = await createClient();
  let query = supabase.from("blog_posts").select(blogSelect).eq("published", true).neq("id", post.id).order("published_at", { ascending: false }).limit(limit);
  if (post.categoryId) query = query.eq("category_id", post.categoryId);
  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar os artigos relacionados: ${error.message}`);
  return Promise.all(((data ?? []) as unknown as BlogQueryRow[]).map((row) => mapBlogSummary(supabase, row)));
}

export async function getAdminPosts(): Promise<AdminBlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts").select(blogSelect).order("updated_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os posts: ${error.message}`);
  return Promise.all(((data ?? []) as unknown as BlogQueryRow[]).map((row) => mapAdminBlogPost(supabase, row)));
}

export async function getAdminPostById(id: string): Promise<AdminBlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts").select(blogSelect).eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o post: ${error.message}`);
  return data ? mapAdminBlogPost(supabase, data as unknown as BlogQueryRow) : null;
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_categories").select("id, name, slug, description").order("name");
  if (error) throw new Error(`Não foi possível carregar as categorias: ${error.message}`);
  return (data ?? []).map((category) => ({ ...category, description: category.description ?? "" }));
}

export async function getPublishedPostCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("published", true);
  if (error) return 0;
  return count ?? 0;
}
