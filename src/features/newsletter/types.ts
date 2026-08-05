export type NewsletterStatus = "pending" | "active" | "unsubscribed";

export type PublicNewsletterSource = "home" | "blog" | "blog_post" | "footer" | "popup";
export type NewsletterSource = PublicNewsletterSource | "admin_manual";

export type NewsletterCampaignStatus = "draft" | "scheduled" | "sending" | "paused" | "sent" | "cancelled";
export type NewsletterCampaignRecipientStatus = "pending" | "processing" | "sent" | "failed" | "skipped";
export type NewsletterCampaignBlockType = "heading" | "paragraph" | "image" | "button" | "divider" | "spacer";
export type NewsletterCampaignBlock = {
  id: string;
  type: NewsletterCampaignBlockType;
  data: { text?: string; url?: string; label?: string; assetId?: string; alt?: string; height?: number; level?: 1 | 2 | 3 };
};
export type NewsletterCampaign = {
  id: string; internalTitle: string; subject: string; preheader: string; content: NewsletterCampaignBlock[];
  status: NewsletterCampaignStatus; scheduledAt: string | null; audienceFrozenAt: string | null; sendingStartedAt: string | null;
  sentAt: string | null; cancelledAt: string | null; archivedAt: string | null; pauseReason: string; lastError: string;
  recipientCount: number; sentCount: number; failedCount: number; skippedCount: number; createdAt: string; updatedAt: string;
};
export type NewsletterCampaignRecipient = { id: string; campaignId: string; name: string; email: string; status: NewsletterCampaignRecipientStatus; attempts: number; providerMessageId: string | null; errorMessage: string; sentAt: string | null };

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
