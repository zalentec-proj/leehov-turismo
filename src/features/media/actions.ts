"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActiveProfile } from "@/features/auth/queries";
import { getMediaAssetById } from "@/features/media/queries";
import { mediaMetadataSchema, mediaUploadSchema } from "@/features/media/schema";
import type { MediaActionResult } from "@/features/media/types";
import { validateMediaImage } from "@/features/media/utils";
import { createClient } from "@/lib/supabase/server";

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

export async function uploadMediaAssetAction(formData: FormData): Promise<MediaActionResult> {
  const profile = await requireActiveProfile();
  const metadata = mediaUploadSchema.safeParse({
    altText: formData.get("altText") ?? "",
    caption: formData.get("caption") ?? "",
    folder: formData.get("folder") ?? "general",
  });
  if (!metadata.success) return { success: false, message: metadata.error.issues[0]?.message ?? "Revise os dados da imagem." };
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) return { success: false, message: "Selecione uma imagem." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateMediaImage(file.type, file.size, bytes);
  if (!validation.success) return validation;

  const supabase = await createClient();
  const id = randomUUID();
  const storagePath = `${metadata.data.folder}/${id}/${randomUUID()}.${validation.extension}`;
  const { error: uploadError } = await supabase.storage.from("site-media").upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, message: uploadError.message };

  const { error: insertError } = await supabase.from("media_assets").insert({
    id,
    storage_path: storagePath,
    file_name: file.name.slice(0, 255),
    mime_type: file.type,
    file_size: file.size,
    alt_text: emptyToNull(metadata.data.altText),
    caption: emptyToNull(metadata.data.caption),
    folder: metadata.data.folder,
    created_by: profile.id,
  });
  if (insertError) {
    await supabase.storage.from("site-media").remove([storagePath]);
    return { success: false, message: insertError.message };
  }
  revalidateMedia();
  const asset = await getMediaAssetById(id);
  return { success: true, message: "Imagem adicionada à biblioteca.", asset: asset ?? undefined };
}

export async function updateMediaAssetAction(input: unknown): Promise<MediaActionResult> {
  await requireActiveProfile();
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
  await requireActiveProfile();
  const supabase = await createClient();
  const { data: asset, error } = await supabase.from("media_assets").select("id, storage_path").eq("id", id).maybeSingle();
  if (error || !asset) return { success: false, message: "Imagem não encontrada." };
  const [testimonials, popups, settings] = await Promise.all([
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("image_asset_id", id),
    supabase.from("popups").select("id", { count: "exact", head: true }).eq("image_asset_id", id),
    supabase.from("site_settings").select("id", { count: "exact", head: true }).eq("media_asset_id", id),
  ]);
  if ((testimonials.count ?? 0) + (popups.count ?? 0) + (settings.count ?? 0) > 0) {
    return { success: false, message: "Esta imagem está em uso. Remova os vínculos antes de excluí-la." };
  }
  const { error: storageError } = await supabase.storage.from("site-media").remove([asset.storage_path]);
  if (storageError) return { success: false, message: storageError.message };
  const { error: deleteError } = await supabase.from("media_assets").delete().eq("id", id);
  if (deleteError) return { success: false, message: deleteError.message };
  revalidateMedia();
  return { success: true, message: "Imagem excluída da biblioteca." };
}
