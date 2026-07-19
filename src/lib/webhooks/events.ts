import "server-only";

import { after } from "next/server";

import type { WebhookEvent } from "@/features/webhooks/types";
import { createWebhookDeliveries, deliverWebhookLog } from "@/lib/webhooks/delivery";
import type { Json } from "@/types/database";

export async function emitWebhookEvent(event: WebhookEvent, data: Record<string, Json | undefined>) {
  const deliveryIds = await createWebhookDeliveries(event, data);
  if (!deliveryIds.length) return;
  after(async () => {
    await Promise.allSettled(deliveryIds.map((id) => deliverWebhookLog(id)));
  });
}
