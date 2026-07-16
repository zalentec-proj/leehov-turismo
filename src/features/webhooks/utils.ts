import type { WebhookEvent } from "@/features/webhooks/types";

export function isContentWebhookEvent(event: WebhookEvent) {
  return event.startsWith("caravan.") || event.startsWith("blog_post.");
}
