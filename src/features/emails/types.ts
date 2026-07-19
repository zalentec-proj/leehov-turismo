export type EmailTemplateKey =
  | "admin_caravan_lead"
  | "visitor_caravan_lead_confirmation"
  | "admin_contact"
  | "visitor_contact_confirmation"
  | "newsletter_double_opt_in"
  | "newsletter_welcome";

export type EmailStatus = "pending" | "sent" | "failed" | "skipped";

export type EmailLog = {
  id: string;
  templateKey: EmailTemplateKey;
  recipientEmail: string;
  subject: string;
  provider: string;
  providerMessageId: string | null;
  status: EmailStatus;
  errorMessage: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type EmailDeliveryResult = {
  status: Exclude<EmailStatus, "pending">;
  logId: string;
  providerMessageId?: string;
};
