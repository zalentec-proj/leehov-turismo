"use server";

import { revalidatePath } from "next/cache";
import { createElement } from "react";
import { AdminCaravanLeadEmail } from "@/emails/templates/admin-caravan-lead-email";
import { AdminContactEmail } from "@/emails/templates/admin-contact-email";
import { VisitorCaravanLeadConfirmationEmail } from "@/emails/templates/visitor-caravan-lead-confirmation-email";
import { VisitorContactConfirmationEmail } from "@/emails/templates/visitor-contact-confirmation-email";
import { requireActiveProfile } from "@/features/auth/queries";
import {
  caravanInterestLeadSchema,
  contactLeadSchema,
  leadStatusSchema,
  type CaravanInterestLeadInput,
  type ContactLeadInput,
} from "@/features/leads/schema";
import type { LeadActionResult, LeadStatus } from "@/features/leads/types";
import { parseEmailRecipients, sendTransactionalEmail } from "@/lib/email/send-email";
import { protectPublicForm } from "@/lib/security/public-forms";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPublicSiteSettings, getServerEmailSettings } from "@/features/settings/queries";
import { buildWhatsAppUrl } from "@/features/settings/utils";
import { emitWebhookEvent } from "@/lib/webhooks/events";

const genericFailure = "Não foi possível enviar agora. Tente novamente em alguns instantes.";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function whatsappUrl(message: string) {
  const settings = await getPublicSiteSettings();
  if (!settings.whatsapp.number) return undefined;
  return buildWhatsAppUrl(settings.whatsapp.number, message);
}

function attribution(input: ContactLeadInput | CaravanInterestLeadInput) {
  return {
    pagePath: input.pagePath,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    utmContent: input.utmContent,
    utmTerm: input.utmTerm,
  };
}

async function sendContactEmails(input: {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  const adminUrl = `${siteUrl()}/admin/leads`;
  const emailSettings = await getServerEmailSettings();
  const teamRecipients = emailSettings.contactRecipients.length ? emailSettings.contactRecipients : parseEmailRecipients(process.env.ADMIN_CONTACT_EMAIL);
  const internalRecipients = teamRecipients.length ? teamRecipients : [undefined];
  const visitorWhatsapp = await whatsappUrl("Olá, enviei uma mensagem pelo site da Leehov Turismo.");

  await Promise.allSettled([
    ...internalRecipients.map((recipient) => sendTransactionalEmail({
      templateKey: "admin_contact",
      to: recipient,
      subject: "Nova mensagem recebida pelo site",
      react: createElement(AdminContactEmail, { ...input, adminUrl }),
      replyTo: input.email,
      relatedEntityType: "lead",
      relatedEntityId: input.leadId,
    })),
    sendTransactionalEmail({
      templateKey: "visitor_contact_confirmation",
      to: input.email,
      subject: "Recebemos sua mensagem",
      react: createElement(VisitorContactConfirmationEmail, { name: input.name, whatsappUrl: visitorWhatsapp }),
      relatedEntityType: "lead",
      relatedEntityId: input.leadId,
    }),
  ]);
}

async function sendCaravanInterestEmails(input: {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  message: string;
  caravanTitle: string;
  caravanSlug: string;
}) {
  const adminUrl = `${siteUrl()}/admin/leads`;
  const caravanUrl = `${siteUrl()}/caravanas/${input.caravanSlug}`;
  const emailSettings = await getServerEmailSettings();
  const teamRecipients = emailSettings.leadRecipients.length ? emailSettings.leadRecipients : parseEmailRecipients(process.env.ADMIN_LEADS_EMAIL);
  const internalRecipients = teamRecipients.length ? teamRecipients : [undefined];
  const visitorWhatsapp = await whatsappUrl(`Olá, gostaria de mais informações sobre a caravana ${input.caravanTitle}.`);

  await Promise.allSettled([
    ...internalRecipients.map((recipient) => sendTransactionalEmail({
      templateKey: "admin_caravan_lead",
      to: recipient,
      subject: `Novo interesse em caravana: ${input.caravanTitle}`,
      react: createElement(AdminCaravanLeadEmail, { ...input, adminUrl }),
      replyTo: input.email,
      relatedEntityType: "lead",
      relatedEntityId: input.leadId,
    })),
    sendTransactionalEmail({
      templateKey: "visitor_caravan_lead_confirmation",
      to: input.email,
      subject: `Recebemos seu interesse na caravana ${input.caravanTitle}`,
      react: createElement(VisitorCaravanLeadConfirmationEmail, {
        name: input.name,
        caravanTitle: input.caravanTitle,
        caravanUrl,
        whatsappUrl: visitorWhatsapp,
      }),
      relatedEntityType: "lead",
      relatedEntityId: input.leadId,
    }),
  ]);
}

export async function createContactLeadAction(rawInput: ContactLeadInput): Promise<LeadActionResult> {
  const parsed = contactLeadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados informados." };
  }

  try {
    const input = parsed.data;
    const security = await protectPublicForm({
      scope: "contact",
      honeypot: input.company,
      turnstileToken: input.turnstileToken,
      attribution: attribution(input),
    });
    if (!security.allowed) return { success: security.silent, message: security.message };

    const admin = createAdminClient();
    const { data: lead, error } = await admin
      .from("leads")
      .insert({
        name: input.name,
        email: input.email.toLocaleLowerCase("pt-BR"),
        phone: input.phone,
        message: input.message,
        source: "contact",
        metadata: security.metadata,
      })
      .select("id")
      .single();
    if (error) throw error;

    await emitWebhookEvent("lead.created", { leadId: lead.id, source: "contact" });
    await emitWebhookEvent("contact.created", { leadId: lead.id });

    await sendContactEmails({ leadId: lead.id, name: input.name, email: input.email, phone: input.phone, message: input.message });
    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    return {
      success: true,
      message: "Mensagem enviada. Nossa equipe entrará em contato em breve.",
      id: lead.id,
      whatsappUrl: await whatsappUrl("Olá, enviei uma mensagem pelo site da Leehov Turismo."),
    };
  } catch {
    return { success: false, message: genericFailure };
  }
}

export async function createCaravanInterestAction(rawInput: CaravanInterestLeadInput): Promise<LeadActionResult> {
  const parsed = caravanInterestLeadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados informados." };
  }

  try {
    const input = parsed.data;
    const security = await protectPublicForm({
      scope: "caravan_interest",
      honeypot: input.company,
      turnstileToken: input.turnstileToken,
      attribution: attribution(input),
    });
    if (!security.allowed) return { success: security.silent, message: security.message };

    const admin = createAdminClient();
    const { data: caravan, error: caravanError } = await admin
      .from("caravans")
      .select("id, title, slug")
      .eq("id", input.caravanId)
      .eq("published", true)
      .maybeSingle();
    if (caravanError) throw caravanError;
    if (!caravan) return { success: false, message: "Esta caravana não está disponível para receber interesses." };

    const { data: lead, error } = await admin
      .from("leads")
      .insert({
        name: input.name,
        email: input.email.toLocaleLowerCase("pt-BR"),
        phone: input.phone,
        city: input.city,
        state: input.state,
        message: input.message,
        source: "caravan_interest",
        caravan_id: caravan.id,
        metadata: security.metadata,
      })
      .select("id")
      .single();
    if (error) throw error;

    await emitWebhookEvent("lead.created", { leadId: lead.id, source: "caravan_interest", caravanId: caravan.id });
    await emitWebhookEvent("caravan_interest.created", { leadId: lead.id, caravanId: caravan.id });

    await sendCaravanInterestEmails({
      leadId: lead.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      city: input.city,
      state: input.state,
      message: input.message,
      caravanTitle: caravan.title,
      caravanSlug: caravan.slug,
    });
    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    return {
      success: true,
      message: "Interesse enviado. A equipe Leehov falará com você em breve.",
      id: lead.id,
      whatsappUrl: await whatsappUrl(`Olá, gostaria de mais informações sobre a caravana ${caravan.title}.`),
    };
  } catch {
    return { success: false, message: genericFailure };
  }
}

export async function updateLeadStatusAction(id: string, rawStatus: LeadStatus): Promise<LeadActionResult> {
  const profile = await requireActiveProfile();
  const parsedId = leadStatusSchema.safeParse(rawStatus);
  if (!id.match(/^[0-9a-f-]{36}$/i) || !parsedId.success) {
    return { success: false, message: "Lead ou status inválido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ status: parsedId.data, updated_by: profile.id })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, message: "Não foi possível atualizar o lead." };

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  return { success: true, message: "Status do lead atualizado." };
}
