import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AdminBlogPost, BlogPostDetail, BlogPostSummary } from "@/features/blog/types";

export type BlogQueryRow = Database["public"]["Tables"]["blog_posts"]["Row"] & {
  category: Database["public"]["Tables"]["blog_categories"]["Row"] | null;
  images: Database["public"]["Tables"]["blog_post_images"]["Row"][];
  relatedCaravan: Pick<Database["public"]["Tables"]["caravans"]["Row"], "id" | "title" | "slug" | "published"> | null;
};

export async function resolveBlogAssetUrl(supabase: SupabaseClient<Database>, path: string | null): Promise<string> {
  if (!path) return "";
  const { data } = await supabase.storage.from("blog-images").createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

export async function mapBlogSummary(supabase: SupabaseClient<Database>, row: BlogQueryRow): Promise<BlogPostSummary> {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category?.name ?? "Sem categoria",
    categoryId: row.category_id ?? "",
    categorySlug: row.category?.slug ?? "",
    summary: row.summary ?? "",
    readingTime: row.reading_time ?? 1,
    imagePath: row.cover_image_url ?? "",
    imageUrl: await resolveBlogAssetUrl(supabase, row.cover_image_url),
    coverAltText: row.cover_alt_text ?? row.title,
    author: row.author ?? "Equipe Leehov",
    publishedAt: row.published_at ?? row.created_at,
    relatedDestination: row.related_destination ?? "",
    featuredHome: row.featured_home,
    featuredBlog: row.featured_blog,
  };
}

export async function mapBlogDetail(supabase: SupabaseClient<Database>, row: BlogQueryRow): Promise<BlogPostDetail> {
  const summary = await mapBlogSummary(supabase, row);
  return {
    ...summary,
    content: row.content ?? "",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    relatedCaravan: row.relatedCaravan,
    images: await Promise.all([...(row.images ?? [])].sort((a, b) => a.order_index - b.order_index).map(async (image) => ({
      id: image.id,
      imagePath: image.image_url,
      imageUrl: await resolveBlogAssetUrl(supabase, image.image_url),
      altText: image.alt_text ?? "",
      caption: image.caption ?? "",
      orderIndex: image.order_index,
    }))),
  };
}

export async function mapAdminBlogPost(supabase: SupabaseClient<Database>, row: BlogQueryRow): Promise<AdminBlogPost> {
  return {
    ...(await mapBlogDetail(supabase, row)),
    published: row.published,
    sourceUrl: row.source_url ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
