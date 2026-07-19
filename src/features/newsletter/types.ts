export type NewsletterStatus = "pending" | "active" | "unsubscribed";

export type NewsletterSource = "home" | "blog" | "blog_post" | "footer" | "popup";

export type NewsletterSubscriber = {
  id: string;
  name: string;
  email: string;
  source: NewsletterSource | string;
  status: NewsletterStatus;
  active: boolean;
  confirmationSentAt: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterMetrics = {
  total: number;
  pending: number;
  active: number;
  unsubscribed: number;
};

export type NewsletterActionResult = {
  success: boolean;
  message: string;
  status?: "confirmed" | "expired" | "invalid" | "unsubscribed";
};
