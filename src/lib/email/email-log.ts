import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailStatus, EmailTemplateKey } from "@/features/emails/types";
import type { Json, TablesUpdate } from "@/types/database";

type CreateEmailLogInput = {
  templateKey: EmailTemplateKey;
  recipientEmail?: string;
  subject: string;
  status: EmailStatus;
  errorMessage?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, Json | undefined>;
  idempotencyKey?: string;
};

export async function createEmailLog(input: CreateEmailLogInput) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_logs")
    .insert({
      template_key: input.templateKey,
      recipient_email: input.recipientEmail || null,
      subject: input.subject,
      status: input.status,
      error_message: input.errorMessage || null,
      related_entity_type: input.relatedEntityType || null,
      related_entity_id: input.relatedEntityId || null,
      metadata: input.metadata ?? {},
      idempotency_key: input.idempotencyKey || null,
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function finishEmailLog(input: {
  id: string;
  status: Exclude<EmailStatus, "pending">;
  providerMessageId?: string;
  errorMessage?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("email_logs")
    .update({
      status: input.status,
      provider_message_id: input.providerMessageId || null,
      error_message: input.errorMessage || null,
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", input.id);

  if (error) throw error;
}

export async function updateEmailLogFromProvider(input: {
  providerMessageId: string;
  status: Extract<EmailStatus, "sent" | "delivered" | "delayed" | "bounced" | "complained" | "suppressed" | "failed">;
  eventAt: string;
  errorMessage?: string;
}) {
  const update: TablesUpdate<"email_logs"> = {
    status: input.status,
    last_event_at: input.eventAt,
    error_message: input.errorMessage?.slice(0, 500) ?? null,
  };
  if (input.status === "delivered") update.delivered_at = input.eventAt;
  const { error } = await createAdminClient()
    .from("email_logs")
    .update(update)
    .eq("provider_message_id", input.providerMessageId)
    .or(`last_event_at.is.null,last_event_at.lt.${input.eventAt}`);
  if (error) throw error;
}
