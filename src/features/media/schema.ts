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
  sourceType: z.string().trim().regex(/^[a-z][a-z0-9_-]{0,49}$/).default("general"),
  sourceId: z.string().uuid().or(z.literal("")).default(""),
  sourceLabel: z.string().trim().max(180).default(""),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});
