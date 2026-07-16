import "server-only";
import type { ReactElement } from "react";
import { getResendClient } from "@/lib/email/resend";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput) {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is missing.");
  }

  return getResendClient().emails.send({
    from,
    to: input.to,
    subject: input.subject,
    react: input.react,
    replyTo: input.replyTo ?? process.env.RESEND_REPLY_TO_EMAIL,
  });
}
