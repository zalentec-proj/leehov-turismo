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
