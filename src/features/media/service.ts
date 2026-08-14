import "server-only";

import { randomUUID } from "node:crypto";
import type { MediaAsset, MediaFolder } from "@/features/media/types";
import { createAdminClient } from "@/lib/supabase/admin";

type CreateMediaAssetInput = {
  bytes: Uint8Array;
  extension: string;
  fileName: string;
  mimeType: string;
  altText?: string;
  caption?: string;
  folder: MediaFolder;
  sourceType: string;
  sourceId?: string;
  sourceLabel?: string;
  tags?: string[];
  createdBy: string;
};

const emptyToNull = (value?: string) => value?.trim() || null;

export async function createMediaAsset(input: CreateMediaAssetInput): Promise<MediaAsset> {
  const admin = createAdminClient();
  const id = randomUUID();
  const storagePath = `${input.folder}/${id}/${randomUUID()}.${input.extension}`;
  const tags = [...new Set([input.folder, input.sourceType, ...(input.tags ?? [])].map((tag) => tag.trim().toLocaleLowerCase("pt-BR")).filter(Boolean))].slice(0, 20);

  const { error: uploadError } = await admin.storage.from("site-media").upload(storagePath, input.bytes, {
    cacheControl: "31536000",
    contentType: input.mimeType,
    upsert: false,
  });
  if (uploadError) throw new Error("Não foi possível enviar a imagem para a Biblioteca de Mídia.");

  const { error: insertError } = await admin.from("media_assets").insert({
    id,
    storage_bucket: "site-media",
    storage_path: storagePath,
    file_name: input.fileName.slice(0, 255),
    mime_type: input.mimeType,
    file_size: input.bytes.byteLength,
    alt_text: emptyToNull(input.altText),
    caption: emptyToNull(input.caption),
    folder: input.folder,
    source_type: input.sourceType,
    source_id: input.sourceId || null,
    source_label: emptyToNull(input.sourceLabel),
    tags,
    created_by: input.createdBy,
  });
  if (insertError) {
    await admin.storage.from("site-media").remove([storagePath]);
    throw new Error("A imagem foi enviada, mas não pôde ser registrada na Biblioteca de Mídia.");
  }

  const { data: signed, error: signedError } = await admin.storage.from("site-media").createSignedUrl(storagePath, 3600);
  if (signedError || !signed?.signedUrl) {
    await admin.from("media_assets").delete().eq("id", id);
    await admin.storage.from("site-media").remove([storagePath]);
    throw new Error("Não foi possível preparar a visualização da imagem.");
  }

  const now = new Date().toISOString();
  return {
    id,
    storageBucket: "site-media",
    storagePath,
    fileName: input.fileName.slice(0, 255),
    mimeType: input.mimeType,
    fileSize: input.bytes.byteLength,
    altText: input.altText?.trim() ?? "",
    caption: input.caption?.trim() ?? "",
    folder: input.folder,
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? "",
    sourceLabel: input.sourceLabel?.trim() ?? "",
    tags,
    createdAt: now,
    updatedAt: now,
    signedUrl: signed.signedUrl,
    usage: [],
  };
}
