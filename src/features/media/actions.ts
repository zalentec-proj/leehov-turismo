"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/features/auth/permissions";
import { mediaMetadataSchema, mediaUploadSchema } from "@/features/media/schema";
import type { MediaActionResult, MediaPreviewResult } from "@/features/media/types";
import { createMediaAsset } from "@/features/media/service";
import { removeMediaObject } from "@/features/media/object-storage";
import { validateMediaImage } from "@/features/media/utils";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function emptyToNull(value: string) {
  return value.trim() || null;
}

function revalidateMedia() {
  revalidatePath("/");
  revalidatePath("/admin/midia");
  revalidatePath("/admin/depoimentos");
  revalidatePath("/admin/popups");
  revalidatePath("/admin/configuracoes");
}

const mediaPreviewIdsSchema = z.array(z.string().uuid()).min(1).max(15);

export async function getMediaPreviewUrlsAction(input: unknown): Promise<MediaPreviewResult> {
  await requirePermission("media.view");
  const parsed = mediaPreviewIdsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Não foi possível preparar as miniaturas.", urls: {} };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_assets")
    .select("id")
    .in("id", [...new Set(parsed.data)]);
  if (error) return { success: false, message: "Não foi possível carregar as miniaturas.", urls: {} };
  return {
    success: true,
    message: "Miniaturas carregadas.",
    urls: Object.fromEntries((data ?? []).map((asset) => [asset.id, `/api/media/${asset.id}?w=384&q=78`])),
  };
}

export async function uploadMediaAssetAction(formData: FormData): Promise<MediaActionResult> {
  const { profile } = await requirePermission("media.upload");
  const metadata = mediaUploadSchema.safeParse({
    altText: formData.get("altText") ?? "",
    caption: formData.get("caption") ?? "",
    folder: formData.get("folder") ?? "general",
    sourceType: formData.get("sourceType") ?? "general",
    sourceId: formData.get("sourceId") ?? "",
    sourceLabel: formData.get("sourceLabel") ?? "",
    tags: String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
  });
  if (!metadata.success) return { success: false, message: metadata.error.issues[0]?.message ?? "Revise os dados da imagem." };
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) return { success: false, message: "Selecione uma imagem." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateMediaImage(file.type, file.size, bytes);
  if (!validation.success) return validation;

  try {
    const asset = await createMediaAsset({
      bytes,
      extension: validation.extension,
      fileName: file.name,
      mimeType: file.type,
      altText: metadata.data.altText,
      caption: metadata.data.caption,
      folder: metadata.data.folder,
      sourceType: metadata.data.sourceType,
      sourceId: metadata.data.sourceId,
      sourceLabel: metadata.data.sourceLabel,
      tags: metadata.data.tags,
      createdBy: profile.id,
    });
    revalidateMedia();
    return { success: true, message: "Imagem adicionada à biblioteca.", asset };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Não foi possível enviar a imagem." };
  }
}

export async function updateMediaAssetAction(input: unknown): Promise<MediaActionResult> {
  await requirePermission("media.update");
  const parsed = mediaMetadataSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados da imagem." };
  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").update({
    alt_text: emptyToNull(parsed.data.altText),
    caption: emptyToNull(parsed.data.caption),
    folder: parsed.data.folder,
  }).eq("id", parsed.data.id);
  if (error) return { success: false, message: error.message };
  revalidateMedia();
  return { success: true, message: "Informações da imagem atualizadas." };
}

export async function deleteMediaAssetAction(id: string): Promise<MediaActionResult> {
  await requirePermission("media.delete");
  const supabase = createAdminClient();
  const { data: asset, error } = await supabase.from("media_assets").select("*").eq("id", id).maybeSingle();
  if (error || !asset) return { success: false, message: "Imagem não encontrada." };
  const [testimonials, popups, settings, caravans, caravanImages, itinerary, posts, postImages] = await Promise.all([
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("image_asset_id", id),
    supabase.from("popups").select("id", { count: "exact", head: true }).eq("image_asset_id", id),
    supabase.from("site_settings").select("id", { count: "exact", head: true }).eq("media_asset_id", id),
    supabase.from("caravans").select("id", { count: "exact", head: true }).or(`card_image_url.eq.${asset.storage_path},hero_image_url.eq.${asset.storage_path},video_thumbnail_url.eq.${asset.storage_path},leader_image_url.eq.${asset.storage_path}`),
    supabase.from("caravan_images").select("id", { count: "exact", head: true }).eq("image_url", asset.storage_path),
    supabase.from("caravan_itinerary_days").select("id", { count: "exact", head: true }).eq("image_url", asset.storage_path),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("cover_image_url", asset.storage_path),
    supabase.from("blog_post_images").select("id", { count: "exact", head: true }).eq("image_url", asset.storage_path),
  ]);
  if ([testimonials, popups, settings, caravans, caravanImages, itinerary, posts, postImages].some((result) => (result.count ?? 0) > 0)) {
    return { success: false, message: "Esta imagem está em uso. Remova os vínculos antes de excluí-la." };
  }
  try {
    await removeMediaObject({
      provider: "storage_provider" in asset && asset.storage_provider === "r2" ? "r2" : "supabase",
      bucket: asset.storage_bucket,
      path: asset.storage_path,
    });
  } catch (storageError) {
    return { success: false, message: storageError instanceof Error ? storageError.message : "Não foi possível excluir a imagem." };
  }
  const { error: deleteError } = await supabase.from("media_assets").delete().eq("id", id);
  if (deleteError) return { success: false, message: deleteError.message };
  revalidateMedia();
  return { success: true, message: "Imagem excluída da biblioteca." };
}
