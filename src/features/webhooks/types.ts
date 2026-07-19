export const WEBHOOK_EVENTS = [
  "lead.created",
  "caravan_interest.created",
  "contact.created",
  "newsletter.subscribed",
  "newsletter.confirmed",
  "google_review.created",
  "google_review.low_rating",
  "caravan.created",
  "caravan.updated",
  "caravan.published",
  "blog_post.published",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
export type WebhookDeliveryStatus = "pending" | "sent" | "failed";

export type Webhook = {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  validationKeyConfigured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebhookDeliveryLog = {
  id: string;
  deliveryId: string;
  webhookId: string;
  webhookName: string;
  event: WebhookEvent;
  payloadVersion: number;
  status: WebhookDeliveryStatus;
  attempts: number;
  responseStatus: number | null;
  responseBody: string;
  errorMessage: string;
  createdAt: string;
  completedAt: string;
};

export type WebhookMetrics = {
  total: number;
  active: number;
  pendingDeliveries: number;
  sentDeliveries: number;
  failedDeliveries: number;
};

export type WebhookActionResult = {
  success: boolean;
  message: string;
  id?: string;
};
