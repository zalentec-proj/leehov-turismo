import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailStatus, EmailTemplateKey } from "@/features/emails/types";
import type { Json } from "@/types/database";

type CreateEmailLogInput = {
  templateKey: EmailTemplateKey;
  recipientEmail?: string;
  subject: string;
  status: EmailStatus;
  errorMessage?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, Json | undefined>;
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
