import "server-only";

import { after } from "next/server";

import type { WebhookEvent } from "@/features/webhooks/types";
import { createWebhookDeliveries, deliverWebhookLog } from "@/lib/webhooks/delivery";
import type { Json } from "@/types/database";

export async function emitWebhookEvent(event: WebhookEvent, data: Record<string, Json | undefined>) {
  // A webhook is an integration side effect. Its persistence or delivery must
  // never make the action that created the primary record fail after it has
  // already committed (for example, a blog post that was just published).
  try {
    after(async () => {
      try {
        const deliveryIds = await createWebhookDeliveries(event, data);
        await Promise.allSettled(deliveryIds.map((id) => deliverWebhookLog(id)));
      } catch {
        console.error(`Não foi possível processar o webhook ${event}.`);
      }
    });
  } catch {
    console.error(`Não foi possível enfileirar o webhook ${event}.`);
  }
}
