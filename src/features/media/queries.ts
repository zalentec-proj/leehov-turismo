import "server-only";

import { requirePermission } from "@/features/auth/permissions";
import type { MediaAsset, MediaUsage } from "@/features/media/types";
import { createClient } from "@/lib/supabase/server";

type MediaRow = {
  id: string;
  storage_provider?: "supabase" | "r2";
  storage_bucket: "site-media" | "caravan-images" | "blog-images";
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  alt_text: string | null;
  caption: string | null;
  folder: string;
  source_type: string;
  source_id: string | null;
  source_label: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

function mapAsset(row: MediaRow, signedUrl: string, usage: MediaUsage[] = []): MediaAsset {
  return {
    id: row.id,
    storageProvider: row.storage_provider === "r2" ? "r2" : "supabase",
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    altText: row.alt_text ?? "",
    caption: row.caption ?? "",
    folder: row.folder,
    sourceType: row.source_type,
    sourceId: row.source_id ?? "",
    sourceLabel: row.source_label ?? "",
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    signedUrl,
    usage,
  };
}

export async function getAdminMediaAssets(): Promise<MediaAsset[]> {
  await requirePermission("media.view");
  const supabase = await createClient();
  const [assetsResult, testimonials, popups, settings, caravans, caravanImages, itinerary, posts, postImages] = await Promise.all([
    supabase.from("media_assets").select("*").order("created_at", { ascending: false }),
    supabase.from("testimonials").select("id, name, image_asset_id").not("image_asset_id", "is", null),
    supabase.from("popups").select("id, title, image_asset_id").not("image_asset_id", "is", null),
    supabase.from("site_settings").select("id, key, media_asset_id").not("media_asset_id", "is", null),
    supabase.from("caravans").select("id, title, card_image_url, hero_image_url, video_thumbnail_url, leader_image_url"),
    supabase.from("caravan_images").select("id, caravan_id, image_url"),
    supabase.from("caravan_itinerary_days").select("id, caravan_id, image_url").not("image_url", "is", null),
    supabase.from("blog_posts").select("id, title, cover_image_url"),
    supabase.from("blog_post_images").select("id, blog_post_id, image_url"),
  ]);
  if (assetsResult.error) throw new Error(`Não foi possível carregar a biblioteca: ${assetsResult.error.message}`);

  const rows = (assetsResult.data ?? []) as MediaRow[];
  const idByPath = new Map(rows.map((row) => [row.storage_path, row.id]));
  const usageByAsset = new Map<string, MediaUsage[]>();
  const append = (assetId: string | null | undefined, usage: MediaUsage) => {
    if (!assetId) return;
    const current = usageByAsset.get(assetId) ?? [];
    if (!current.some((item) => item.type === usage.type && item.id === usage.id)) usageByAsset.set(assetId, [...current, usage]);
  };
  const appendPath = (path: string | null | undefined, usage: MediaUsage) => append(path ? idByPath.get(path) : null, usage);

  for (const item of testimonials.data ?? []) append(item.image_asset_id, { id: item.id, label: item.name, type: "testimonial" });
  for (const item of popups.data ?? []) append(item.image_asset_id, { id: item.id, label: item.title, type: "popup" });
  for (const item of settings.data ?? []) append(item.media_asset_id, { id: item.id, label: item.key, type: "setting" });

  const caravanNames = new Map((caravans.data ?? []).map((item) => [item.id, item.title]));
  for (const item of caravans.data ?? []) {
    const usage = { id: item.id, label: item.title, type: "package" as const };
    appendPath(item.card_image_url, usage);
    appendPath(item.hero_image_url, usage);
    appendPath(item.video_thumbnail_url, usage);
    appendPath(item.leader_image_url, usage);
  }
  for (const item of caravanImages.data ?? []) appendPath(item.image_url, { id: item.caravan_id, label: caravanNames.get(item.caravan_id) ?? "Pacote", type: "package" });
  for (const item of itinerary.data ?? []) appendPath(item.image_url, { id: item.caravan_id, label: caravanNames.get(item.caravan_id) ?? "Pacote", type: "package" });

  const postNames = new Map((posts.data ?? []).map((item) => [item.id, item.title]));
  for (const item of posts.data ?? []) appendPath(item.cover_image_url, { id: item.id, label: item.title, type: "blog_post" });
  for (const item of postImages.data ?? []) appendPath(item.image_url, { id: item.blog_post_id, label: postNames.get(item.blog_post_id) ?? "Post", type: "blog_post" });

  return rows.map((row) => mapAsset(row, "", usageByAsset.get(row.id) ?? []));
}

export async function getMediaAssetOptions() {
  await requirePermission("media.view");
  const supabase = await createClient();
  const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar a biblioteca: ${error.message}`);
  return ((data ?? []) as MediaRow[]).map((row) => mapAsset(row, ""));
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("media_assets").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const row = data as MediaRow;
  return mapAsset(row, `/api/media/${row.id}`);
}
