"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/features/auth/permissions";
import { captureLead } from "./server";
import { commercialSchema, contactConfirmationSchema, spendSchema } from "./commercial";
import { localDay } from "./report";

function refresh(id?: string) {
  revalidatePath("/admin/conversoes");
  revalidatePath("/admin/leads");
  if (id) revalidatePath("/admin/leads/" + id);
}

export async function confirmWhatsAppContact(raw: unknown) {
  await requirePermission("leads.view");
  const { profile } = await requirePermission("leads.update");
  const parsed = contactConfirmationSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: "Confira os dados e confirme que recebeu o contato." };
  const input = parsed.data;
  if (!input.leadId) await requirePermission("leads.create");
  if (!input.reference && !input.leadId) {
    return { success: false, message: "Para um contato sem referência, cadastre ou abra o lead e informe a origem no perfil." };
  }
  const admin = createAdminClient();
  const existing = input.leadId ? await admin.from("leads").select("is_test").eq("id", input.leadId).maybeSingle() : null;
  if (existing && (existing.error || !existing.data)) return { success: false, message: "Lead não encontrado." };
  try {
    const result = await captureLead({
      ...input, source: "whatsapp", confirmContact: true, actorId: profile.id,
      isTest: existing?.data?.is_test ?? false, email: input.email.toLowerCase(),
      ...(input.reportedChannel && !input.reference ? { basis: "reported", attribution: {
        conversion: { channel: input.reportedChannel, campaign: input.reportedCampaign || undefined },
      } } : {}),
    });
    if (result.result === "reference_missing") return { success: false, message: "Referência não encontrada ou expirada. Confira o código na mensagem." };
    if (result.result === "lead_missing") return { success: false, message: "O lead não existe ou é de um ambiente diferente da tentativa." };
    if (!result.id) return { success: false, message: "Não foi possível vincular o contato." };
    refresh(result.id);
    return { success: true as const, id: result.id, message: result.result === "reference_linked" ? "Esta referência já foi vinculada." : "Contato recebido registrado." };
  } catch {
    return { success: false, message: "Não foi possível vincular o contato." };
  }
}

export async function saveCommercialLead(raw: unknown) {
  await requirePermission("leads.view");
  const { profile } = await requirePermission("leads.update");
  const parsed = commercialSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os dados comerciais." };
  const input = parsed.data;
  const { data, error } = await createAdminClient().rpc("update_commercial_lead", {
    p_data: {
      ...input, email: input.email.toLowerCase(), actorId: profile.id, allowTestChange: profile.role === "admin",
      saleMinor: input.sale || null, saleCurrency: input.sale ? input.saleCurrency : null,
      proposalMinor: input.proposal || null, proposalCurrency: input.proposal ? input.proposalCurrency : null,
    },
  });
  const result = data && typeof data === "object" && "result" in data ? data.result : null;
  if (result === "duplicate") return { success: false, message: "Já existe um cadastro com este telefone nessa categoria." };
  if (error || result !== "updated") {
    return { success: false, message: "Confira a etapa, os valores e a data. Para desfazer uma venda, use a opção de cancelamento." };
  }
  refresh(input.leadId);
  return { success: true, message: "Dados comerciais salvos." };
}

export async function saveCampaignSpend(raw: unknown) {
  const { profile } = await requirePermission("conversions.manage_costs");
  const parsed = spendSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: "Confira a data, a campanha, a moeda e o valor." };
  const item = parsed.data;
  if (item.day > localDay(new Date())) return { success: false, message: "Informe uma data de gasto já realizado." };
  const { error } = await createAdminClient().from("campaign_spend").upsert({
    day: item.day, channel: item.channel, medium: item.medium.toLowerCase(), campaign: item.campaignId || item.campaign,
    currency: item.currency, amount_minor: item.amount, updated_by: profile.id, updated_at: new Date().toISOString(),
  });
  if (error) return { success: false, message: "Não foi possível registrar o investimento." };
  refresh();
  return { success: true, message: "Investimento realizado registrado." };
}
