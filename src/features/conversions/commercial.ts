import { z } from "zod";
import { channelLabels, cleanCampaignTag } from "./attribution";
import { referencePattern } from "./whatsapp";

export const stageLabels = {
  new: "Novo",
  contact_received: "Contato recebido",
  qualified: "Qualificado",
  quote_requested: "Orçamento solicitado",
  proposal_sent: "Proposta enviada",
  negotiation: "Negociação",
  won: "Ganho",
  lost: "Perdido",
} as const;
export const stageSchema = z.enum(Object.keys(stageLabels) as [keyof typeof stageLabels, ...(keyof typeof stageLabels)[]]);
export const currencySchema = z.enum(["BRL", "USD", "EUR"]);
export type Currency = z.infer<typeof currencySchema>;
export const channelSchema = z.enum(Object.keys(channelLabels) as [keyof typeof channelLabels, ...(keyof typeof channelLabels)[]]);
const tagSchema = z.string().trim().max(100).refine((value) => value === "" || Boolean(cleanCampaignTag(value)), "Use um rótulo de campanha sem dados pessoais.");
const money = z.string().trim().regex(/^\d{1,9}(?:[.,]\d{1,2})?$/).transform((value) => {
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}).refine((value) => value <= 10_000_000_000);
const positiveMoney = money.refine((value) => value > 0);
const phone = z.string().trim().min(8).max(24).regex(/^[\d+().\s-]+$/).refine((value) => {
  const digits = value.replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 10 && digits.length <= 15;
});
const uuidOrEmpty = z.uuid().or(z.literal(""));

export const commercialSchema = z.object({
  leadId: z.uuid(), stage: stageSchema, at: z.iso.datetime({ offset: true }).or(z.literal("")),
  name: z.string().trim().min(2).max(100), phone, email: z.email().max(254).or(z.literal("")),
  nextAction: z.string().trim().max(240), lossReason: z.string().trim().max(500),
  caravanId: uuidOrEmpty, isTest: z.boolean().optional(), cancelSale: z.boolean(),
  proposal: positiveMoney.or(z.literal("")), proposalCurrency: currencySchema,
  sale: positiveMoney.or(z.literal("")), saleCurrency: currencySchema,
  reportedChannel: channelSchema.or(z.literal("")), reportedCampaign: tagSchema,
}).refine((value) => value.stage !== "lost" || Boolean(value.lossReason), "Informe o motivo da perda.");

export const contactConfirmationSchema = z.object({
  eventId: z.uuidv4(),
  reference: z.string().trim().toUpperCase().regex(referencePattern).or(z.literal("")),
  leadId: uuidOrEmpty,
  name: z.string().trim().min(2).max(100).or(z.literal("")),
  phone: phone.or(z.literal("")),
  email: z.email().max(254).or(z.literal("")),
  reportedChannel: channelSchema.or(z.literal("")),
  reportedCampaign: tagSchema,
  caravanId: uuidOrEmpty, confirmed: z.literal(true),
}).refine((value) => Boolean(value.leadId || value.name && value.phone), "Informe o nome e o telefone ou escolha um lead.");

export const spendSchema = z.object({
  day: z.iso.date(), channel: channelSchema, medium: tagSchema, campaign: tagSchema,
  campaignId: z.string().max(100).refine((item) => !item || Boolean(cleanCampaignTag(item, true))),
  currency: currencySchema, amount: money,
});
