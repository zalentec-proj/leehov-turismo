import { z } from "zod";

export const testimonialSchema = z.object({
  id: z.string().uuid().or(z.literal("")).default(""),
  name: z.string().trim().min(2, "Informe o nome do viajante.").max(120),
  roleTitle: z.string().trim().max(120).default(""),
  city: z.string().trim().max(120).default(""),
  text: z.string().trim().min(20, "O depoimento deve ter pelo menos 20 caracteres.").max(2000),
  rating: z.coerce.number().int().min(1).max(5),
  imageAssetId: z.string().uuid().or(z.literal("")).default(""),
  active: z.boolean().default(false),
  featured: z.boolean().default(false),
  orderIndex: z.coerce.number().int().min(0).max(100000).default(0),
}).superRefine((value, context) => {
  if (value.featured && !value.active) context.addIssue({ code: "custom", path: ["featured"], message: "Ative o depoimento antes de destacá-lo." });
});

export const googleBusinessSettingsSchema = z.object({
  displayMode: z.enum(["manual", "google", "mixed"]),
  reviewsLimit: z.coerce.number().int().min(1).max(20),
  minRating: z.coerce.number().int().min(1).max(5),
  cacheHours: z.coerce.number().int().min(1).max(168),
  enabled: z.boolean(),
  accountId: z.string().trim().max(255).default(""),
  locationId: z.string().trim().max(255).default(""),
});

export const googleLocationSelectionSchema = z.object({
  accountResourceName: z.string().regex(/^accounts\/[A-Za-z0-9_-]+$/, "Conta inválida."),
  accountName: z.string().trim().min(1).max(200),
  locationResourceName: z.string().regex(/^locations\/[A-Za-z0-9_-]+$/, "Localização inválida."),
  locationName: z.string().trim().min(1).max(200),
  googleMapsUrl: z.string().url().startsWith("https://").or(z.literal("")),
});

export const googleReviewReplySchema = z.object({
  reviewId: z.string().uuid(),
  comment: z.string().trim().min(1, "Escreva a resposta.").refine((value) => Buffer.byteLength(value, "utf8") <= 4096, "A resposta deve ter no máximo 4.096 bytes."),
  confirmed: z.literal(true),
});

export const googleReviewDeleteReplySchema = z.object({
  reviewId: z.string().uuid(),
  confirmed: z.literal(true),
});
