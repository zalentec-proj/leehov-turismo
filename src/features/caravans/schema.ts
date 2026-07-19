import { z } from "zod";

const optionalText = z.string().trim().max(5000);
const optionalVideoUrl = z.string().trim().max(2048).refine((value) => {
  if (!value || value.startsWith("/")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "Use uma URL HTTPS válida do YouTube, Vimeo ou do arquivo de vídeo.");
const optionalUuid = z.union([z.string().uuid(), z.literal("")]);
const optionalPositiveInteger = z.union([z.number().int().positive(), z.null()]);

export const caravanStatusSchema = z.enum([
  "available",
  "coming_soon",
  "waitlist",
  "sold_out",
  "draft",
]);

export const departureStatusSchema = z.enum([
  "available",
  "coming_soon",
  "waitlist",
  "sold_out",
]);

export const caravanDepartureSchema = z.object({
  id: optionalUuid,
  label: optionalText,
  startDate: z.string(),
  endDate: z.string(),
  availableSpots: z.union([z.number().int().nonnegative(), z.null()]),
  status: departureStatusSchema,
  notes: optionalText,
  orderIndex: z.number().int().nonnegative(),
}).superRefine((departure, context) => {
  if (departure.startDate && departure.endDate && departure.startDate > departure.endDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "A data final deve ser posterior à inicial." });
  }
});

export const caravanItineraryDaySchema = z.object({
  id: optionalUuid,
  day: z.number().int().positive("Informe um dia válido."),
  title: z.string().trim().min(2, "Informe o título do dia."),
  location: optionalText,
  description: optionalText,
  imagePath: optionalText,
  meals: z.array(z.string().trim().min(1)),
  accommodation: optionalText,
  notes: optionalText,
  orderIndex: z.number().int().nonnegative(),
});

export const caravanImageSchema = z.object({
  id: optionalUuid,
  imagePath: z.string().trim().min(1, "Informe ou envie uma imagem."),
  altText: optionalText,
  caption: optionalText,
  orderIndex: z.number().int().nonnegative(),
});

export const caravanCategorySchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens."),
  description: optionalText,
  active: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
});

export const caravanFormSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(3, "Informe o nome da caravana.").max(160),
  slug: z.string().trim().min(3, "Informe o slug.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  destination: z.string().trim().min(2, "Informe o destino.").max(180),
  categoryId: optionalUuid,
  type: optionalText,
  summary: optionalText,
  description: optionalText,
  duration: optionalText,
  price: optionalText,
  currency: z.string().trim().regex(/^[A-Z]{3}$/, "Use uma moeda com três letras."),
  status: caravanStatusSchema,
  cardImagePath: optionalText,
  heroImagePath: optionalText,
  videoUrl: optionalVideoUrl,
  videoThumbnailPath: optionalText,
  isGroupTrip: z.boolean(),
  isAccompanied: z.boolean(),
  hasPortugueseGuide: z.boolean(),
  hasLeehovRepresentative: z.boolean(),
  hasTravelKit: z.boolean(),
  hasTravelInsurance: z.boolean(),
  minPeople: optionalPositiveInteger,
  maxPeople: optionalPositiveInteger,
  leaderName: optionalText,
  leaderBio: optionalText,
  leaderImagePath: optionalText,
  included: z.array(z.string().trim().min(1)),
  notIncluded: z.array(z.string().trim().min(1)),
  notes: optionalText,
  featuredHome: z.boolean(),
  featuredHero: z.boolean(),
  heroTitle: optionalText,
  heroDescription: optionalText,
  heroCtaText: optionalText,
  heroCtaUrl: optionalText,
  heroOrder: z.number().int().nonnegative(),
  published: z.boolean(),
  seoTitle: optionalText,
  seoDescription: optionalText,
  departures: z.array(caravanDepartureSchema),
  itinerary: z.array(caravanItineraryDaySchema),
  images: z.array(caravanImageSchema),
}).superRefine((caravan, context) => {
  if (caravan.minPeople && caravan.maxPeople && caravan.minPeople > caravan.maxPeople) {
    context.addIssue({ code: "custom", path: ["maxPeople"], message: "O máximo deve ser maior que o mínimo." });
  }
  if (new Set(caravan.itinerary.map((item) => item.day)).size !== caravan.itinerary.length) {
    context.addIssue({ code: "custom", path: ["itinerary"], message: "Não repita números de dia no roteiro." });
  }
  if (caravan.published) {
    const required: Array<[keyof typeof caravan, string]> = [
      ["summary", "Inclua um resumo antes de publicar."],
      ["description", "Inclua a descrição antes de publicar."],
      ["duration", "Informe a duração antes de publicar."],
      ["heroImagePath", "Inclua uma imagem principal antes de publicar."],
    ];
    required.forEach(([field, message]) => {
      if (!caravan[field]) context.addIssue({ code: "custom", path: [field], message });
    });
    if (caravan.status === "draft") {
      context.addIssue({ code: "custom", path: ["status"], message: "Escolha um status público antes de publicar." });
    }
  }
  if (caravan.featuredHero) {
    if (!caravan.heroTitle) context.addIssue({ code: "custom", path: ["heroTitle"], message: "Informe o título do Hero." });
    if (!caravan.heroDescription) context.addIssue({ code: "custom", path: ["heroDescription"], message: "Informe a descrição do Hero." });
    if (!caravan.heroImagePath) context.addIssue({ code: "custom", path: ["heroImagePath"], message: "Informe a imagem do Hero." });
  }
});

export type CaravanFormInput = z.infer<typeof caravanFormSchema>;
