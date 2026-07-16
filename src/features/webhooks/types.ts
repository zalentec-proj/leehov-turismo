export type WebhookEvent =
  | "lead.created"
  | "caravan_interest.created"
  | "contact.created"
  | "newsletter.subscribed"
  | "newsletter.confirmed"
  | "google_review.created"
  | "google_review.low_rating"
  | "caravan.created"
  | "caravan.updated"
  | "caravan.published"
  | "blog_post.published";
