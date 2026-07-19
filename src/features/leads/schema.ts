import { z } from "zod";

const phoneSchema = z.string().trim().min(8, "Informe um WhatsApp válido.").max(24).refine(
  (value) => value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 15,
  "Informe um WhatsApp com DDD.",
);

const attributionFields = {
  pagePath: z.string().trim().max(500),
  utmSource: z.string().trim().max(100),
  utmMedium: z.string().trim().max(100),
  utmCampaign: z.string().trim().max(100),
  utmContent: z.string().trim().max(100),
  utmTerm: z.string().trim().max(100),
  company: z.string().max(200),
  turnstileToken: z.string().max(2048),
};

export const contactLeadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  phone: phoneSchema,
  message: z.string().trim().min(10, "Conte um pouco mais sobre como podemos ajudar.").max(2000),
  ...attributionFields,
});

export const caravanInterestLeadSchema = z.object({
  caravanId: z.string().uuid("Caravana inválida."),
  name: z.string().trim().min(2, "Informe seu nome.").max(100),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  phone: phoneSchema,
  city: z.string().trim().min(2, "Informe sua cidade.").max(100),
  state: z.string().trim().min(2, "Informe seu estado.").max(50),
  message: z.string().trim().min(10, "Conte um pouco sobre seu interesse.").max(2000),
  ...attributionFields,
});

export const leadStatusSchema = z.enum(["new", "in_progress", "converted", "archived"]);

export type ContactLeadInput = z.infer<typeof contactLeadSchema>;
export type CaravanInterestLeadInput = z.infer<typeof caravanInterestLeadSchema>;
