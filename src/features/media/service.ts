import "server-only";

import { randomUUID } from "node:crypto";
import type { MediaAsset, MediaFolder } from "@/features/media/types";
import {
  getMediaUploadProvider,
  removeMediaObject,
  uploadMediaObject,
} from "@/features/media/object-storage";
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
  const storageProvider = getMediaUploadProvider();
  const storageBucket = "site-media" as const;
  const storagePath = `${input.folder}/${id}/${randomUUID()}.${input.extension}`;
  const tags = [...new Set([input.folder, input.sourceType, ...(input.tags ?? [])].map((tag) => tag.trim().toLocaleLowerCase("pt-BR")).filter(Boolean))].slice(0, 20);

  try {
    await uploadMediaObject(
      { provider: storageProvider, bucket: storageBucket, path: storagePath },
      input.bytes,
      input.mimeType,
    );
  } catch {
    throw new Error("Não foi possível enviar a imagem para a Biblioteca de Mídia.");
  }

  const record = {
    id,
    storage_bucket: storageBucket,
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
    ...(storageProvider === "r2" ? { storage_provider: storageProvider } : {}),
  };
  const { error: insertError } = await admin.from("media_assets").insert(record);
  if (insertError) {
    await removeMediaObject({ provider: storageProvider, bucket: storageBucket, path: storagePath });
    throw new Error("A imagem foi enviada, mas não pôde ser registrada na Biblioteca de Mídia.");
  }

  const now = new Date().toISOString();
  return {
    id,
    storageProvider,
    storageBucket,
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
    signedUrl: `/api/media/${id}`,
    usage: [],
  };
}
