import { z } from "zod";

export const mediaAssetSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  altText: z.string().optional(),
});
