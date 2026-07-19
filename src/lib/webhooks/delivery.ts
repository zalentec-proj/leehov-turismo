import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import type { WebhookEvent } from "@/features/webhooks/types";
import { decryptSecret } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSafeWebhookUrl } from "@/lib/webhooks/endpoint-security";
import type { Json } from "@/types/database";

export const WEBHOOK_SECRET_KEY_ENV = "WEBHOOK_SECRET_ENCRYPTION_KEY";

export type StoredWebhookPayload = {
  version: 1;
  event: WebhookEvent;
  deliveryId: string;
  occurredAt: string;
  data: Record<string, Json | undefined>;
};

function sanitizeExternalText(value: string, maxLength: number) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function createWebhookDeliveries(event: WebhookEvent, data: Record<string, Json | undefined>) {
  const supabase = createAdminClient();
  const { data: hooks, error } = await supabase
    .from("webhooks")
    .select("id")
    .eq("active", true)
    .contains("events", [event]);
  if (error || !hooks?.length) return [];

  const occurredAt = new Date().toISOString();
  const rows = hooks.map((hook) => {
    const deliveryId = randomUUID();
    const payload: StoredWebhookPayload = { version: 1, event, deliveryId, occurredAt, data };
    return {
      delivery_id: deliveryId,
      webhook_id: hook.id,
      event,
      payload_version: 1,
      payload: payload as unknown as Json,
      status: "pending" as const,
    };
  });
  const { data: logs, error: insertError } = await supabase.from("webhook_logs").insert(rows).select("id");
  if (insertError) return [];
  return (logs ?? []).map((log) => log.id);
}

export async function deliverWebhookLog(logId: string, options: { allowInactive?: boolean } = {}) {
  const supabase = createAdminClient();
  const { data: log, error } = await supabase
    .from("webhook_logs")
    .select("*, webhook:webhooks(id, endpoint_url, validation_key_ciphertext, active)")
    .eq("id", logId)
    .single();
  if (error || !log) throw new Error("Entrega de webhook não encontrada.");

  const webhook = log.webhook as unknown as { endpoint_url: string; validation_key_ciphertext: string; active: boolean };
  if (!webhook?.active && !options.allowInactive) {
    await supabase.from("webhook_logs").update({ status: "failed", error_message: "Webhook inativo.", completed_at: new Date().toISOString() }).eq("id", logId);
    return { success: false, message: "O webhook está inativo." };
  }

  const attempt = Math.min(Number(log.attempts) + 1, 25);
  const startedAt = new Date().toISOString();
  await supabase.from("webhook_logs").update({
    status: "pending",
    attempts: attempt,
    request_started_at: startedAt,
    completed_at: null,
    response_status: null,
    response_body: null,
    error_message: null,
  }).eq("id", logId);

  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  try {
    const endpoint = await assertSafeWebhookUrl(webhook.endpoint_url);
    const body = JSON.stringify(log.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const key = decryptSecret(webhook.validation_key_ciphertext, WEBHOOK_SECRET_KEY_ENV);
    const signature = createHmac("sha256", key).update(`${timestamp}.${body}`).digest("hex");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Leehov-Webhooks/1.0",
        "X-Leehov-Event": log.event,
        "X-Leehov-Delivery": log.delivery_id,
        "X-Leehov-Timestamp": timestamp,
        "X-Leehov-Signature": `sha256=${signature}`,
      },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    responseStatus = response.status;
    responseBody = sanitizeExternalText(await response.text(), 4000) || null;
    if (response.status >= 300 && response.status < 400) throw new Error("O endpoint tentou redirecionar a entrega.");
    if (!response.ok) throw new Error(`O endpoint respondeu com status ${response.status}.`);
    await supabase.from("webhook_logs").update({
      status: "sent",
      response_status: response.status,
      response_body: responseBody,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);
    return { success: true, message: "Webhook entregue com sucesso." };
  } catch (deliveryError) {
    const rawMessage = deliveryError instanceof Error ? deliveryError.message : "Falha desconhecida na entrega.";
    const message = sanitizeExternalText(rawMessage, 1000);
    await supabase.from("webhook_logs").update({
      status: "failed",
      response_status: responseStatus,
      response_body: responseBody,
      error_message: message,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);
    return { success: false, message };
  }
}
