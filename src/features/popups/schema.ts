import { z } from "zod";

const safeCtaUrl = z.string().trim().max(1000).refine((value) => {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}, "Use uma rota relativa ou uma URL HTTPS.");

export const popupSchema = z.object({
  id: z.string().uuid().or(z.literal("")).default(""),
  title: z.string().trim().min(3, "Informe o título.").max(140),
  description: z.string().trim().max(1200).default(""),
  imageAssetId: z.string().uuid().or(z.literal("")).default(""),
  buttonText: z.string().trim().max(100).default(""),
  buttonUrl: safeCtaUrl.default(""),
  popupType: z.enum(["campaign", "newsletter", "whatsapp", "caravan"]),
  relatedCaravanId: z.string().uuid().or(z.literal("")).default(""),
  displayLocation: z.enum(["home", "blog", "caravans", "sitewide"]),
  frequency: z.enum(["always", "session", "daily", "weekly"]),
  active: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.popupType === "caravan" && !value.relatedCaravanId) context.addIssue({ code: "custom", path: ["relatedCaravanId"], message: "Selecione uma caravana publicada." });
  if (value.popupType !== "caravan" && value.relatedCaravanId) context.addIssue({ code: "custom", path: ["relatedCaravanId"], message: "Somente pop-ups de caravana podem ter esse vínculo." });
  if (value.popupType === "campaign" && (!value.buttonText || !value.buttonUrl)) context.addIssue({ code: "custom", path: ["buttonText"], message: "A campanha precisa de texto e URL do botão." });
  if (["whatsapp", "caravan"].includes(value.popupType) && (!value.buttonText || value.buttonUrl)) context.addIssue({ code: "custom", path: ["buttonText"], message: "Informe o texto do botão; a URL será criada automaticamente." });
  if (value.popupType === "newsletter" && (value.buttonText || value.buttonUrl)) context.addIssue({ code: "custom", path: ["buttonText"], message: "O pop-up de newsletter usa o formulário integrado e não aceita botão manual." });
});
