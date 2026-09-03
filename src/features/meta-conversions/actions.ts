"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/features/auth/permissions";
import { configureRdMetaPurchaseWebhook, hasRdCredentials } from "@/features/meta-conversions/rd-client";
import { retryMetaConversionEvent, sendMetaTestEvent } from "@/features/meta-conversions/processor";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { success: boolean; message: string };
const settingsSchema = z.object({ enabled: z.boolean(), testEventCode: z.string().trim().max(128) });
const eventSchema = z.object({ id: z.string().uuid() });

function refresh() { revalidatePath("/admin/conversoes-meta"); }

function rdWebhookConfigurationFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const httpStatus = message.match(/HTTP\s+(\d{3})/)?.[1] ?? null;

  if (message.startsWith("RD não respondeu ao listar webhooks")) return { category: "list_webhooks_rejected", httpStatus };
  if (message.startsWith("RD não aceitou o webhook")) return { category: "create_webhook_rejected", httpStatus };
  if (message.startsWith("RD_META_WEBHOOK_SECRET")) return { category: "webhook_secret_missing", httpStatus: null };
  if (message.startsWith("NEXT_PUBLIC_SITE_URL")) return { category: "site_url_missing", httpStatus: null };
  if (message.includes("OAuth")) return { category: "rd_oauth_unavailable", httpStatus };
  return { category: "unexpected", httpStatus };
}

export async function saveMetaConversionSettingsAction(input: unknown): Promise<Result> {
  const { profile } = await requirePermission("meta_conversions.manage");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Revise as configurações." };
  if (parsed.data.enabled && !(process.env.RD_META_WEBHOOK_SECRET && hasRdCredentials() && process.env.META_CAPI_ACCESS_TOKEN)) {
    return { success: false, message: "Cadastre o segredo do webhook, a credencial OAuth (ou fallback temporário) do RD e o token da Meta antes de ativar o envio." };
  }
  const { error } = await createAdminClient().from("meta_conversion_settings").update({ enabled: parsed.data.enabled, test_event_code: parsed.data.testEventCode || null, updated_by: profile.id }).eq("id", true);
  if (error) return { success: false, message: "Não foi possível salvar a configuração." };
  refresh();
  return { success: true, message: parsed.data.enabled ? "Envio de compras ativado." : "Envio de compras pausado." };
}

export async function testMetaConversionAction(): Promise<Result> {
  await requirePermission("meta_conversions.manage");
  try {
    await sendMetaTestEvent((await createAdminClient().from("meta_conversion_settings").select("test_event_code").eq("id", true).single()).data?.test_event_code ?? null);
    return { success: true, message: "Evento técnico enviado. Confira-o no Gerenciador de Eventos." };
  } catch (error) { return { success: false, message: error instanceof Error ? error.message : "Não foi possível enviar o teste." }; }
}

export async function configureRdMetaPurchaseWebhookAction(): Promise<Result> {
  await requirePermission("meta_conversions.manage");
  try {
    const result = await configureRdMetaPurchaseWebhook();
    return { success: true, message: result.created ? "Webhook do RD criado e protegido." : "Webhook do RD já estava configurado." };
  } catch (error) {
    const failure = rdWebhookConfigurationFailure(error);
    // Deliberately log only a fixed category and an HTTP status. Tokens, URLs and response bodies stay out of logs.
    console.error("rd_meta_webhook_configuration_failed", failure);
    return { success: false, message: `Não foi possível configurar o webhook do RD. Código seguro: ${failure.category}${failure.httpStatus ? ` (HTTP ${failure.httpStatus})` : ""}.` };
  }
}

export async function retryMetaConversionAction(input: unknown): Promise<Result> {
  await requirePermission("meta_conversions.manage");
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Evento inválido." };
  const result = await retryMetaConversionEvent(parsed.data.id);
  refresh();
  return { success: result.status === "sent", message: result.message };
}
