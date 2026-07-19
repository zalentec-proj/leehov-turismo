import "server-only";

import { requireAdminProfile } from "@/features/auth/queries";
import type { Webhook, WebhookDeliveryLog, WebhookMetrics } from "@/features/webhooks/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getAdminWebhooks(): Promise<Webhook[]> {
  await requireAdminProfile();
  const { data, error } = await createAdminClient().from("webhooks").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os webhooks.");
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    url: row.endpoint_url,
    events: row.events,
    active: row.active,
    validationKeyConfigured: Boolean(row.validation_key_ciphertext),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getWebhookDeliveryLogs(limit = 100): Promise<WebhookDeliveryLog[]> {
  await requireAdminProfile();
  const { data, error } = await createAdminClient()
    .from("webhook_logs")
    .select("*, webhook:webhooks(name)")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) throw new Error("Não foi possível carregar o histórico de entregas.");
  return (data ?? []).map((row) => {
    const webhook = row.webhook as unknown as { name?: string } | null;
    return {
      id: row.id,
      deliveryId: row.delivery_id,
      webhookId: row.webhook_id,
      webhookName: webhook?.name ?? "Webhook removido",
      event: row.event,
      payloadVersion: row.payload_version,
      status: row.status,
      attempts: row.attempts,
      responseStatus: row.response_status,
      responseBody: row.response_body ?? "",
      errorMessage: row.error_message ?? "",
      createdAt: row.created_at,
      completedAt: row.completed_at ?? "",
    };
  });
}

export async function getWebhookMetrics(): Promise<WebhookMetrics> {
  await requireAdminProfile();
  const supabase = createAdminClient();
  const [total, active, pending, sent, failed] = await Promise.all([
    supabase.from("webhooks").select("id", { head: true, count: "exact" }),
    supabase.from("webhooks").select("id", { head: true, count: "exact" }).eq("active", true),
    supabase.from("webhook_logs").select("id", { head: true, count: "exact" }).eq("status", "pending"),
    supabase.from("webhook_logs").select("id", { head: true, count: "exact" }).eq("status", "sent"),
    supabase.from("webhook_logs").select("id", { head: true, count: "exact" }).eq("status", "failed"),
  ]);
  return {
    total: total.count ?? 0,
    active: active.count ?? 0,
    pendingDeliveries: pending.count ?? 0,
    sentDeliveries: sent.count ?? 0,
    failedDeliveries: failed.count ?? 0,
  };
}
