import "server-only";

import { requirePermission } from "@/features/auth/permissions";
import type { EmailLog, EmailTemplateKey } from "@/features/emails/types";
import type { NewsletterCampaign, NewsletterCampaignBlock, NewsletterMetrics, NewsletterStatus, NewsletterSubscriber } from "@/features/newsletter/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getAdminNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  await requirePermission("newsletter.view");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, name, email, source, status, active, confirmation_sent_at, confirmed_at, unsubscribed_at, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os inscritos: ${error.message}`);

  return data.map((subscriber) => ({
    id: subscriber.id,
    name: subscriber.name ?? "",
    email: subscriber.email,
    source: subscriber.source,
    status: subscriber.status as NewsletterStatus,
    active: Boolean(subscriber.active),
    confirmationSentAt: subscriber.confirmation_sent_at,
    confirmedAt: subscriber.confirmed_at,
    unsubscribedAt: subscriber.unsubscribed_at,
    createdAt: subscriber.created_at,
    updatedAt: subscriber.updated_at,
  }));
}

export async function getNewsletterMetrics(): Promise<NewsletterMetrics> {
  await requirePermission("newsletter.view_logs");
  const supabase = await createClient();
  const { data, error } = await supabase.from("newsletter_subscribers").select("status");
  if (error) return { total: 0, pending: 0, active: 0, unsubscribed: 0 };
  return {
    total: data.length,
    pending: data.filter((subscriber) => subscriber.status === "pending").length,
    active: data.filter((subscriber) => subscriber.status === "active").length,
    unsubscribed: data.filter((subscriber) => subscriber.status === "unsubscribed").length,
  };
}

export async function getEmailLogs(limit = 200): Promise<EmailLog[]> {
  await requirePermission("newsletter.view");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_logs")
    .select("id, template_key, recipient_email, subject, provider, provider_message_id, status, error_message, related_entity_type, related_entity_id, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Não foi possível carregar os logs de e-mail: ${error.message}`);

  return data.map((log) => ({
    id: log.id,
    templateKey: log.template_key as EmailTemplateKey,
    recipientEmail: log.recipient_email ?? "",
    subject: log.subject,
    provider: log.provider,
    providerMessageId: log.provider_message_id,
    status: log.status,
    errorMessage: log.error_message,
    relatedEntityType: log.related_entity_type,
    relatedEntityId: log.related_entity_id,
    createdAt: log.created_at,
    sentAt: log.sent_at,
  }));
}

export async function getAdminNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
  await requirePermission("newsletter.view");
  const admin = createAdminClient();
  const { data, error } = await admin.from("newsletter_campaigns").select("*, recipients:newsletter_campaign_recipients(status)").is("archived_at", null).order("created_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar as campanhas: ${error.message}`);
  return (data ?? []).map((row) => {
    const recipients = row.recipients ?? [];
    return {
      id: row.id, internalTitle: row.internal_title, subject: row.subject, preheader: row.preheader ?? "",
      content: row.content as unknown as NewsletterCampaignBlock[], status: row.status, scheduledAt: row.scheduled_at,
      audienceFrozenAt: row.audience_frozen_at, sendingStartedAt: row.sending_started_at, sentAt: row.sent_at,
      cancelledAt: row.cancelled_at, archivedAt: row.archived_at, pauseReason: row.pause_reason ?? "", lastError: row.last_error ?? "",
      recipientCount: recipients.length, sentCount: recipients.filter((item) => item.status === "sent").length,
      failedCount: recipients.filter((item) => item.status === "failed").length, skippedCount: recipients.filter((item) => item.status === "skipped").length,
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  });
}
