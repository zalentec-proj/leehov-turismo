import type { EmailTemplateKey } from "@/features/emails/types";

export function humanizeEmailTemplate(templateKey: EmailTemplateKey) {
  return templateKey.replaceAll("_", " ");
}
