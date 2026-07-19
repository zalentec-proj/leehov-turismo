import "server-only";

import { requireActiveProfile } from "@/features/auth/queries";
import type { MediaAsset, MediaUsage } from "@/features/media/types";
import { createClient } from "@/lib/supabase/server";

type MediaRow = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  alt_text: string | null;
  caption: string | null;
  folder: string;
  created_at: string;
  updated_at: string;
};

export async function signSiteMediaPath(path: string, expiresIn = 3600) {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("site-media").createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? "";
}

async function mapAsset(row: MediaRow, usage: MediaUsage[] = []): Promise<MediaAsset> {
  return {
    id: row.id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    altText: row.alt_text ?? "",
    caption: row.caption ?? "",
    folder: row.folder,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    signedUrl: await signSiteMediaPath(row.storage_path),
    usage,
  };
}

export async function getAdminMediaAssets(): Promise<MediaAsset[]> {
  await requireActiveProfile();
  const supabase = await createClient();
  const [{ data, error }, testimonials, popups, settings] = await Promise.all([
    supabase.from("media_assets").select("*").order("created_at", { ascending: false }),
    supabase.from("testimonials").select("id, name, image_asset_id").not("image_asset_id", "is", null),
    supabase.from("popups").select("id, title, image_asset_id").not("image_asset_id", "is", null),
    supabase.from("site_settings").select("id, key, media_asset_id").not("media_asset_id", "is", null),
  ]);
  if (error) throw new Error(`Não foi possível carregar a biblioteca: ${error.message}`);
  const usageByAsset = new Map<string, MediaUsage[]>();
  const append = (assetId: string | null, usage: MediaUsage) => {
    if (!assetId) return;
    usageByAsset.set(assetId, [...(usageByAsset.get(assetId) ?? []), usage]);
  };
  for (const item of testimonials.data ?? []) append(item.image_asset_id, { id: item.id, label: item.name, type: "testimonial" });
  for (const item of popups.data ?? []) append(item.image_asset_id, { id: item.id, label: item.title, type: "popup" });
  for (const item of settings.data ?? []) append(item.media_asset_id, { id: item.id, label: item.key, type: "setting" });
  return Promise.all(((data ?? []) as MediaRow[]).map((row) => mapAsset(row, usageByAsset.get(row.id) ?? [])));
}

export async function getMediaAssetOptions() {
  return getAdminMediaAssets();
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("media_assets").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapAsset(data as MediaRow);
}
