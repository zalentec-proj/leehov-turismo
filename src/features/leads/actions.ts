"use server";

import { revalidatePath } from "next/cache";
import { createElement } from "react";
import { AdminCaravanLeadEmail } from "@/emails/templates/admin-caravan-lead-email";
import { AdminContactEmail } from "@/emails/templates/admin-contact-email";
import { VisitorCaravanLeadConfirmationEmail } from "@/emails/templates/visitor-caravan-lead-confirmation-email";
import { VisitorContactConfirmationEmail } from "@/emails/templates/visitor-contact-confirmation-email";
import { requirePermission } from "@/features/auth/permissions";
import {
  caravanInterestLeadSchema,
  contactLeadSchema,
  leadInteractionSchema,
  leadPipelineSchema,
  leadStatusSchema,
  manualLeadSchema,
  type CaravanInterestLeadInput,
  type ContactLeadInput,
} from "@/features/leads/schema";
import type { LeadActionResult, LeadInteractionType, LeadStatus } from "@/features/leads/types";
import { parseEmailRecipients, sendTransactionalEmail } from "@/lib/email/send-email";
import { protectPublicForm } from "@/lib/security/public-forms";
import { createAdminClient } from "@/lib/supabase/admin";
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
  await requirePermission("leads.update");
  const parsedId = leadStatusSchema.safeParse(rawStatus);
  if (!id.match(/^[0-9a-f-]{36}$/i) || !parsedId.success) {
    return { success: false, message: "Lead ou status inválido." };
  }

  return updateLeadPipelineAction({ id, status: parsedId.data });
}

function refreshLeadPaths(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  if (id) revalidatePath(`/admin/leads/${id}`);
}

async function insertInteraction(input: {
  leadId: string;
  type: LeadInteractionType;
  title: string;
  body?: string;
  metadata?: Record<string, string | null>;
  profileId: string;
}) {
  const { data, error } = await createAdminClient().from("lead_interactions").insert({
    lead_id: input.leadId,
    interaction_type: input.type,
    title: input.title,
    body: input.body?.trim() || null,
    metadata: input.metadata ?? {},
    created_by: input.profileId,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function emitLeadOperationalEvent(event: "lead.created" | "lead.updated" | "lead.status_changed" | "lead.interaction.created", leadId: string, interaction?: { id: string; type: LeadInteractionType }) {
  const { data } = await createAdminClient().from("leads").select("id, name, email, phone, source, status, caravan_id, assigned_to, next_follow_up_at").eq("id", leadId).maybeSingle();
  if (!data) return;
  await emitWebhookEvent(event, {
    leadId: data.id,
    name: data.name,
    email: data.email ?? undefined,
    phone: data.phone,
    source: data.source,
    status: data.status,
    caravanId: data.caravan_id ?? undefined,
    assignedTo: data.assigned_to ?? undefined,
    nextFollowUpAt: data.next_follow_up_at ?? undefined,
    interactionId: interaction?.id,
    interactionType: interaction?.type,
  });
}

export async function createManualLeadAction(input: unknown): Promise<LeadActionResult> {
  const { profile } = await requirePermission("leads.create");
  const parsed = manualLeadSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do lead." };
  const value = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await admin.from("leads").insert({
    name: value.name,
    phone: value.phone,
    email: value.email ? value.email.toLocaleLowerCase("pt-BR") : null,
    message: value.message || null,
    city: value.city || null,
    state: value.state || null,
    source: value.source,
    caravan_id: value.caravanId || null,
    assigned_to: value.assignedTo || null,
    next_follow_up_at: value.nextFollowUpAt || null,
    status: "new",
    metadata: { createdFrom: "admin" },
    updated_by: profile.id,
  }).select("id").single();
  if (error || !data) return { success: false, message: "Não foi possível cadastrar o lead." };
  await insertInteraction({ leadId: data.id, type: "profile_update", title: "Lead cadastrado manualmente", profileId: profile.id });
  await emitLeadOperationalEvent("lead.created", data.id);
  refreshLeadPaths(data.id);
  return { success: true, message: "Lead cadastrado.", id: data.id };
}

export async function updateLeadPipelineAction(input: unknown): Promise<LeadActionResult> {
  const parsed = leadPipelineSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Atualização inválida." };
  const required = new Set<"leads.update" | "leads.assign">();
  if (parsed.data.status !== undefined || parsed.data.nextFollowUpAt !== undefined) required.add("leads.update");
  if (parsed.data.assignedTo !== undefined) required.add("leads.assign");
  const requiredPermissions = [...required];
  if (!requiredPermissions.length) return { success: false, message: "Nenhuma alteração foi informada." };
  const { profile } = await requirePermission(requiredPermissions[0]);
  for (const permission of requiredPermissions.slice(1)) await requirePermission(permission);
  const admin = createAdminClient();
  const { data: current } = await admin.from("leads").select("status, assigned_to, next_follow_up_at").eq("id", parsed.data.id).maybeSingle();
  if (!current) return { success: false, message: "Lead não encontrado." };
  const changes: { status?: LeadStatus; assigned_to?: string | null; next_follow_up_at?: string | null; updated_by: string } = { updated_by: profile.id };
  if (parsed.data.status !== undefined) changes.status = parsed.data.status;
  if (parsed.data.assignedTo !== undefined) changes.assigned_to = parsed.data.assignedTo || null;
  if (parsed.data.nextFollowUpAt !== undefined) changes.next_follow_up_at = parsed.data.nextFollowUpAt || null;
  const { data, error } = await admin.from("leads").update(changes).eq("id", parsed.data.id).select("id").maybeSingle();
  if (error || !data) return { success: false, message: "Não foi possível atualizar o lead." };

  let interaction: { id: string; type: LeadInteractionType } | undefined;
  if (parsed.data.status !== undefined && parsed.data.status !== current.status) {
    const id = await insertInteraction({ leadId: data.id, type: "status_change", title: "Status atualizado", metadata: { from: current.status, to: parsed.data.status }, profileId: profile.id });
    interaction = { id, type: "status_change" };
    await emitLeadOperationalEvent("lead.status_changed", data.id, interaction);
  } else if (parsed.data.assignedTo !== undefined && (parsed.data.assignedTo || null) !== current.assigned_to) {
    const id = await insertInteraction({ leadId: data.id, type: "assignment", title: parsed.data.assignedTo ? "Responsável atualizado" : "Responsável removido", metadata: { assignedTo: parsed.data.assignedTo || null }, profileId: profile.id });
    interaction = { id, type: "assignment" };
  } else if (parsed.data.nextFollowUpAt !== undefined && (parsed.data.nextFollowUpAt || null) !== current.next_follow_up_at) {
    const id = await insertInteraction({ leadId: data.id, type: "follow_up", title: parsed.data.nextFollowUpAt ? "Próximo contato agendado" : "Acompanhamento removido", metadata: { nextFollowUpAt: parsed.data.nextFollowUpAt || null }, profileId: profile.id });
    interaction = { id, type: "follow_up" };
  }
  await emitLeadOperationalEvent("lead.updated", data.id, interaction);
  if (interaction) await emitLeadOperationalEvent("lead.interaction.created", data.id, interaction);
  refreshLeadPaths(data.id);
  return { success: true, message: "Lead atualizado." };
}

export async function addLeadInteractionAction(input: unknown): Promise<LeadActionResult> {
  const { profile } = await requirePermission("leads.interact");
  const parsed = leadInteractionSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise a interação." };
  const id = await insertInteraction({ leadId: parsed.data.leadId, type: parsed.data.type, title: parsed.data.title, body: parsed.data.body, profileId: profile.id });
  await emitLeadOperationalEvent("lead.interaction.created", parsed.data.leadId, { id, type: parsed.data.type });
  refreshLeadPaths(parsed.data.leadId);
  return { success: true, message: "Interação registrada.", id };
}

export async function recordLeadWhatsAppInteractionAction(leadId: string): Promise<void> {
  try {
    const { profile } = await requirePermission("leads.interact");
    const id = await insertInteraction({ leadId, type: "whatsapp", title: "Conversa iniciada pelo WhatsApp", profileId: profile.id });
    await emitLeadOperationalEvent("lead.interaction.created", leadId, { id, type: "whatsapp" });
    refreshLeadPaths(leadId);
  } catch {
    // A abertura do wa.me não depende do registro de auditoria.
  }
}
