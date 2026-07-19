"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireAdminProfile } from "@/features/auth/queries";
import { webhookRetrySchema, webhookSchema, webhookTestSchema } from "@/features/webhooks/schema";
import type { WebhookActionResult } from "@/features/webhooks/types";
import { encryptSecret, hasEncryptionKey } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliverWebhookLog, WEBHOOK_SECRET_KEY_ENV, type StoredWebhookPayload } from "@/lib/webhooks/delivery";
import { assertSafeWebhookUrl } from "@/lib/webhooks/endpoint-security";
import type { Json } from "@/types/database";

function refreshWebhooks() {
  revalidatePath("/admin");
  revalidatePath("/admin/webhooks");
}

export async function saveWebhookAction(input: unknown): Promise<WebhookActionResult> {
  const profile = await requireAdminProfile();
  const parsed = webhookSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do webhook." };
  if (!hasEncryptionKey(WEBHOOK_SECRET_KEY_ENV)) return { success: false, message: "Configure WEBHOOK_SECRET_ENCRYPTION_KEY no servidor antes de salvar webhooks." };
  try {
    await assertSafeWebhookUrl(parsed.data.url);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "URL de webhook insegura." };
  }

  const supabase = createAdminClient();
  const id = parsed.data.id || undefined;
  if (!id && parsed.data.validationKey.length < 16) {
    return { success: false, message: "A chave de validação deve ter ao menos 16 caracteres." };
  }
  const basePayload = {
    name: parsed.data.name,
    endpoint_url: parsed.data.url,
    events: parsed.data.events,
    active: parsed.data.active,
    updated_by: profile.id,
  };
  if (id) {
    const payload = parsed.data.validationKey
      ? { ...basePayload, validation_key_ciphertext: encryptSecret(parsed.data.validationKey, WEBHOOK_SECRET_KEY_ENV) }
      : basePayload;
    const { error } = await supabase.from("webhooks").update(payload).eq("id", id);
    if (error) return { success: false, message: "Não foi possível atualizar o webhook." };
    refreshWebhooks();
    return { success: true, message: "Webhook atualizado.", id };
  }
  const { data, error } = await supabase.from("webhooks").insert({
    ...basePayload,
    validation_key_ciphertext: encryptSecret(parsed.data.validationKey, WEBHOOK_SECRET_KEY_ENV),
    created_by: profile.id,
  }).select("id").single();
  if (error || !data) return { success: false, message: "Não foi possível criar o webhook." };
  refreshWebhooks();
  return { success: true, message: "Webhook criado. A chave não será exibida novamente.", id: data.id };
}

export async function setWebhookActiveAction(id: string, active: boolean): Promise<WebhookActionResult> {
  const profile = await requireAdminProfile();
  const parsed = webhookTestSchema.safeParse({ id });
  if (!parsed.success) return { success: false, message: "Webhook inválido." };
  const { error } = await createAdminClient().from("webhooks").update({ active, updated_by: profile.id }).eq("id", id);
  if (error) return { success: false, message: "Não foi possível alterar o webhook." };
  refreshWebhooks();
  return { success: true, message: active ? "Webhook ativado." : "Webhook desativado." };
}

export async function deleteWebhookAction(id: string): Promise<WebhookActionResult> {
  await requireAdminProfile();
  const parsed = webhookTestSchema.safeParse({ id });
  if (!parsed.success) return { success: false, message: "Webhook inválido." };
  const supabase = createAdminClient();
  const { data: webhook } = await supabase.from("webhooks").select("active").eq("id", id).maybeSingle();
  if (!webhook) return { success: false, message: "Webhook não encontrado." };
  if (webhook.active) return { success: false, message: "Desative o webhook antes de excluí-lo." };
  const { count } = await supabase.from("webhook_logs").select("id", { head: true, count: "exact" }).eq("webhook_id", id);
  if (count) return { success: false, message: "Este webhook possui histórico e deve ser mantido inativo para preservar a auditoria." };
  const { error } = await supabase.from("webhooks").delete().eq("id", id);
  if (error) return { success: false, message: "Não foi possível excluir o webhook." };
  refreshWebhooks();
  return { success: true, message: "Webhook excluído." };
}

export async function testWebhookAction(input: unknown): Promise<WebhookActionResult> {
  await requireAdminProfile();
  const parsed = webhookTestSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Webhook inválido." };
  const supabase = createAdminClient();
  const { data: webhook } = await supabase.from("webhooks").select("id, events").eq("id", parsed.data.id).single();
  if (!webhook) return { success: false, message: "Webhook não encontrado." };
  const deliveryId = randomUUID();
  const event = webhook.events[0];
  const payload: StoredWebhookPayload = {
    version: 1,
    event,
    deliveryId,
    occurredAt: new Date().toISOString(),
    data: { test: true, source: "admin", message: "Entrega fictícia de validação da Leehov." },
  };
  const { data: log, error } = await supabase.from("webhook_logs").insert({
    delivery_id: deliveryId,
    webhook_id: webhook.id,
    event,
    payload_version: 1,
    payload: payload as unknown as Json,
    status: "pending",
  }).select("id").single();
  if (error || !log) return { success: false, message: "Não foi possível preparar o teste." };
  const result = await deliverWebhookLog(log.id, { allowInactive: true });
  refreshWebhooks();
  return { ...result, id: log.id };
}

export async function retryWebhookDeliveryAction(input: unknown): Promise<WebhookActionResult> {
  await requireAdminProfile();
  const parsed = webhookRetrySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Confirme o reenvio da entrega." };
  const supabase = createAdminClient();
  const { data: log } = await supabase.from("webhook_logs").select("id, status").eq("id", parsed.data.id).single();
  if (!log) return { success: false, message: "Entrega não encontrada." };
  if (log.status !== "failed") return { success: false, message: "Somente entregas com falha podem ser reenviadas." };
  const result = await deliverWebhookLog(log.id);
  refreshWebhooks();
  return { ...result, id: log.id };
}
