import "server-only";
import type { ReactElement } from "react";
import type { EmailDeliveryResult, EmailTemplateKey } from "@/features/emails/types";
import { createEmailLog, finishEmailLog } from "@/lib/email/email-log";
import { getResendClient } from "@/lib/email/resend";
import type { Json } from "@/types/database";
import { getServerEmailSettings } from "@/features/settings/queries";

type SendEmailInput = {
  templateKey: EmailTemplateKey;
  to?: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, Json | undefined>;
};

function sanitizeEmailError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "Falha desconhecida no provedor.");
  return raw
    .replace(/re_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .slice(0, 500);
}

export function parseEmailRecipients(value?: string) {
  return (value ?? "")
    .split(/[;,]/)
    .map((email) => email.trim().toLocaleLowerCase("pt-BR"))
    .filter(Boolean);
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<EmailDeliveryResult> {
  const settings = await getServerEmailSettings();
  const from = process.env.RESEND_FROM_EMAIL;
  const visitorConfirmationDisabled = input.templateKey.startsWith("visitor_") && !settings.visitorConfirmationsEnabled;
  const hasProviderConfiguration = Boolean(settings.enabled && !visitorConfirmationDisabled && process.env.RESEND_API_KEY && from);

  if (!input.to || !hasProviderConfiguration) {
    const logId = await createEmailLog({
      ...input,
      recipientEmail: input.to,
      status: "skipped",
      errorMessage: !input.to ? "Destinatário não configurado." : !settings.enabled ? "Envios desativados nas configurações." : visitorConfirmationDisabled ? "Confirmação ao visitante desativada nas configurações." : "Resend ou remetente não configurado.",
    });
    return { status: "skipped", logId };
  }

  const logId = await createEmailLog({
    ...input,
    recipientEmail: input.to,
    status: "pending",
  });

  try {
    const result = await getResendClient().emails.send({
      from: settings.senderName && !String(from).includes("<") ? `${settings.senderName} <${from}>` : from as string,
      to: input.to,
      subject: input.subject,
      react: input.react,
      replyTo: input.replyTo ?? (settings.replyTo || process.env.RESEND_REPLY_TO_EMAIL),
    });

    if (result.error) throw new Error(result.error.message);
    const providerMessageId = result.data?.id;
    await finishEmailLog({ id: logId, status: "sent", providerMessageId });
    return { status: "sent", logId, providerMessageId };
  } catch (error) {
    const errorMessage = sanitizeEmailError(error);
    await finishEmailLog({ id: logId, status: "failed", errorMessage });
    return { status: "failed", logId };
  }
}
