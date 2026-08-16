import { z } from "zod";

const optionalText = z.string().trim().max(5000);
const optionalHeroTitle = z.string().trim().max(64, "O título do Hero deve ter até 64 caracteres.");
const optionalHeroDescription = z.string().trim().max(180, "A descrição do Hero deve ter até 180 caracteres.");
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

const caravanFormBaseSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(3, "Informe o nome do pacote.").max(160),
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
  heroTitle: optionalHeroTitle,
  heroDescription: optionalHeroDescription,
  heroCtaText: optionalText,
  heroCtaUrl: optionalText,
  heroOrder: z.number().int().nonnegative(),
  published: z.boolean(),
  seoTitle: optionalText,
  seoDescription: optionalText,
  departures: z.array(caravanDepartureSchema),
  itinerary: z.array(caravanItineraryDaySchema),
  images: z.array(caravanImageSchema),
});

export type CaravanValidationIssue = {
  path: string;
  message: string;
};

export function getCaravanPublicationIssues(caravan: z.infer<typeof caravanFormBaseSchema>): CaravanValidationIssue[] {
  if (!caravan.published) return [];

  const issues: CaravanValidationIssue[] = [];
  const required: Array<[keyof typeof caravan, string]> = [
    ["summary", "Inclua um resumo antes de publicar."],
    ["description", "Inclua a descrição antes de publicar."],
    ["duration", "Informe a duração antes de publicar."],
    ["heroImagePath", "Inclua uma imagem principal antes de publicar."],
  ];
  required.forEach(([field, message]) => {
    if (!caravan[field]) issues.push({ path: String(field), message });
  });
  if (caravan.status === "draft") {
    issues.push({ path: "status", message: "Escolha um status público antes de publicar." });
  }
  return issues;
}

export function getCaravanHeroIssues(caravan: z.infer<typeof caravanFormBaseSchema>): CaravanValidationIssue[] {
  if (!caravan.featuredHero) return [];

  const issues: CaravanValidationIssue[] = [];
  if (!caravan.heroTitle) issues.push({ path: "heroTitle", message: "Informe o título do Hero." });
  if (!caravan.heroDescription) issues.push({ path: "heroDescription", message: "Informe a descrição do Hero." });
  if (!caravan.heroImagePath) issues.push({ path: "heroImagePath", message: "Informe a imagem do Hero." });
  return issues;
}

export const caravanFormSchema = caravanFormBaseSchema.superRefine((caravan, context) => {
  if (caravan.minPeople && caravan.maxPeople && caravan.minPeople > caravan.maxPeople) {
    context.addIssue({ code: "custom", path: ["maxPeople"], message: "O máximo deve ser maior que o mínimo." });
  }
  if (new Set(caravan.itinerary.map((item) => item.day)).size !== caravan.itinerary.length) {
    context.addIssue({ code: "custom", path: ["itinerary"], message: "Não repita números de dia no roteiro." });
  }
});

export type CaravanFormInput = z.infer<typeof caravanFormSchema>;
