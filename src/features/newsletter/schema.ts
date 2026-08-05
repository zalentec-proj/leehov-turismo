import { z } from "zod";

export const newsletterSignupSchema = z.object({
  name: z.string().trim().max(100).refine(
    (value) => !value || value.length >= 2,
    "Informe pelo menos duas letras no nome.",
  ),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  source: z.enum(["home", "blog", "blog_post", "footer", "popup"]),
  pagePath: z.string().trim().max(500),
  utmSource: z.string().trim().max(100),
  utmMedium: z.string().trim().max(100),
  utmCampaign: z.string().trim().max(100),
  utmContent: z.string().trim().max(100),
  utmTerm: z.string().trim().max(100),
  company: z.string().max(200),
  turnstileToken: z.string().max(2048),
});

export const newsletterTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{40,100}$/, "Token inválido.");

export type NewsletterSignupInput = z.infer<typeof newsletterSignupSchema>;

const blockBase = { id: z.string().uuid() };
export const newsletterCampaignBlockSchema = z.discriminatedUnion("type", [
  z.object({ ...blockBase, type: z.literal("heading"), data: z.object({ text: z.string().trim().min(1).max(200), level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2) }) }),
  z.object({ ...blockBase, type: z.literal("paragraph"), data: z.object({ text: z.string().trim().min(1).max(4000) }) }),
  z.object({ ...blockBase, type: z.literal("image"), data: z.object({ assetId: z.string().uuid(), alt: z.string().trim().min(2).max(300) }) }),
  z.object({ ...blockBase, type: z.literal("button"), data: z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().url().refine((value) => new URL(value).protocol === "https:", "Use uma URL HTTPS.") }) }),
  z.object({ ...blockBase, type: z.literal("divider"), data: z.object({}) }),
  z.object({ ...blockBase, type: z.literal("spacer"), data: z.object({ height: z.number().int().min(8).max(120) }) }),
]);

export const newsletterCampaignSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  internalTitle: z.string().trim().min(2).max(160),
  subject: z.string().trim().min(2).max(200),
  preheader: z.string().trim().max(250),
  content: z.array(newsletterCampaignBlockSchema).min(1).max(100),
});

export const newsletterCampaignScheduleSchema = z.object({ id: z.string().uuid(), scheduledAt: z.string().datetime({ offset: true }) });
export const newsletterCampaignIdSchema = z.string().uuid();
export const newsletterCampaignTestSchema = z.object({ id: z.string().uuid(), email: z.string().email().max(254) });
export const manualSubscriberSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254) });
