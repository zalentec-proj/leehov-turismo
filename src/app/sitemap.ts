import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/features/blog/queries";
import { getPublishedCaravans } from "@/features/caravans/queries";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const [posts, caravans] = await Promise.all([getPublishedPosts(), getPublishedCaravans()]);
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
    ...caravans.map((caravan) => ({
      url: `${baseUrl}/caravanas/${caravan.slug}`,
      lastModified: caravan.publishedAt ? new Date(caravan.publishedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
