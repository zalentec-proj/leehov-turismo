import "server-only";
import type { WebhookEvent } from "@/features/webhooks/types";

export type WebhookPayload = {
  event: WebhookEvent;
  occurredAt: string;
  data: Record<string, unknown>;
};

export function createWebhookPayload(
  event: WebhookEvent,
  data: Record<string, unknown>,
): WebhookPayload {
  return {
    event,
    occurredAt: new Date().toISOString(),
    data,
  };
}
