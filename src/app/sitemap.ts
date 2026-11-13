import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const supabase = await createClient();
  const [posts, caravans] = await Promise.all([
    supabase.from("blog_posts").select("slug, updated_at").eq("published", true),
    supabase.from("caravans").select("slug, updated_at").eq("published", true),
  ]);
  if (posts.error || caravans.error) throw new Error("Não foi possível gerar o sitemap.", {
    cause: posts.error ?? caravans.error,
  });
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/caravanas`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/quem-somos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contato`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/politica-de-privacidade`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...caravans.data.map((caravan) => ({
      url: `${baseUrl}/caravanas/${caravan.slug}`,
      lastModified: caravan.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.data.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
