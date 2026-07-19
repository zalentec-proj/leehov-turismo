import { z } from "zod";

const optionalEmail = z.string().trim().email("Informe um e-mail válido.").or(z.literal(""));
const optionalUrl = z.string().trim().url("Informe uma URL completa e válida.").refine((value) => new URL(value).protocol === "https:", "Use uma URL HTTPS.").or(z.literal(""));
const emailList = z.array(z.string().trim().email()).max(20);

export const siteSettingsSchema = z.object({
  contact: z.object({
    phone: z.string().trim().max(30),
    contactEmail: optionalEmail,
    address: z.string().trim().max(500),
  }),
  whatsapp: z.object({
    number: z.string().trim().regex(/^$|^\+?[0-9 ()-]{8,25}$/, "Informe um WhatsApp válido."),
    defaultMessage: z.string().trim().max(500),
    caravanMessage: z.string().trim().max(500),
  }),
  social: z.object({ instagram: optionalUrl, facebook: optionalUrl, youtube: optionalUrl }),
  home: z.object({
    videoUrl: optionalUrl,
    testimonialsEyebrow: z.string().trim().min(3).max(100),
    testimonialsTitle: z.string().trim().min(3).max(100),
  }),
  seo: z.object({
    siteName: z.string().trim().min(2).max(100),
    titleTemplate: z.string().trim().min(2).max(120).refine((value) => value.includes("%s"), "O template precisa conter %s."),
    defaultDescription: z.string().trim().min(30).max(300),
    ogImageAssetId: z.string().uuid().or(z.literal("")),
  }),
  email: z.object({
    enabled: z.boolean(),
    visitorConfirmationsEnabled: z.boolean(),
    contactRecipients: emailList,
    leadRecipients: emailList,
    senderName: z.string().trim().min(2).max(100),
    replyTo: optionalEmail,
    footerText: z.string().trim().max(500),
    whatsapp: z.string().trim().max(30),
  }),
  tracking: z.object({
    gaMeasurementId: z.string().trim().regex(/^$|^G-[A-Z0-9]{4,20}$/, "ID do GA4 inválido."),
    gtmContainerId: z.string().trim().regex(/^$|^GTM-[A-Z0-9]{4,20}$/, "ID do GTM inválido."),
    metaPixelId: z.string().trim().regex(/^$|^[0-9]{5,30}$/, "ID do Meta Pixel inválido."),
  }),
  consent: z.object({
    enabled: z.boolean(),
    version: z.coerce.number().int().min(1).max(1000),
    durationDays: z.coerce.number().int().min(1).max(365),
  }),
});
