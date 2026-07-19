import { z } from "zod";
import { mediaFolders } from "@/features/media/types";

export const mediaFolderSchema = z.enum(mediaFolders);

export const mediaMetadataSchema = z.object({
  id: z.string().uuid(),
  altText: z.string().trim().max(300, "O texto alternativo deve ter até 300 caracteres."),
  caption: z.string().trim().max(500, "A legenda deve ter até 500 caracteres."),
  folder: mediaFolderSchema,
});

export const mediaUploadSchema = z.object({
  altText: z.string().trim().max(300).default(""),
  caption: z.string().trim().max(500).default(""),
  folder: mediaFolderSchema,
});
