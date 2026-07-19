import "server-only";

import { requireActiveProfile } from "@/features/auth/queries";
import type { EmailLog, EmailTemplateKey } from "@/features/emails/types";
import type { NewsletterMetrics, NewsletterStatus, NewsletterSubscriber } from "@/features/newsletter/types";
import { createClient } from "@/lib/supabase/server";

export async function getAdminNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  await requireActiveProfile();
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
  await requireActiveProfile();
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
  await requireActiveProfile();
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
