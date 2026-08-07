"use server";

import { createHash, randomBytes } from "node:crypto";
import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { NewsletterCampaignEmail } from "@/emails/templates/newsletter-campaign-email";
import { NewsletterDoubleOptInEmail } from "@/emails/templates/newsletter-double-opt-in-email";
import { requirePermission } from "@/features/auth/permissions";
import { buildCampaignTestEmail, freezeCampaignAudience, processCampaign } from "@/features/newsletter/campaign-service";
import { manualSubscriberSchema, newsletterCampaignIdSchema, newsletterCampaignScheduleSchema, newsletterCampaignSchema, newsletterCampaignTestSchema } from "@/features/newsletter/schema";
import type { NewsletterActionResult } from "@/features/newsletter/types";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { getResendApiKey } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const newToken = () => randomBytes(32).toString("base64url");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const refresh = () => { revalidatePath("/admin"); revalidatePath("/admin/newsletter"); };

async function campaignRuntimeError(campaignId: string, requireCron = false) {
  if (!getResendApiKey() || !process.env.RESEND_FROM_EMAIL?.trim()) return "Configure o Resend e o remetente antes de enviar campanhas.";
  if (requireCron && !process.env.NEWSLETTER_CRON_SECRET?.trim()) return "Configure NEWSLETTER_CRON_SECRET antes de agendar campanhas.";
  const { data } = await createAdminClient().from("newsletter_campaigns").select("content").eq("id", campaignId).maybeSingle();
  const hasImage = Array.isArray(data?.content) && data.content.some((block) => block && typeof block === "object" && "type" in block && block.type === "image");
  if (hasImage && !process.env.EMAIL_ASSET_SIGNING_SECRET?.trim()) return "Configure EMAIL_ASSET_SIGNING_SECRET antes de enviar uma campanha com imagens.";
  return "";
}

export async function saveNewsletterCampaignAction(input: unknown): Promise<NewsletterActionResult & { id?: string }> {
  const { profile } = await requirePermission("newsletter.manage_drafts");
  const parsed = newsletterCampaignSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise a campanha." };
  const admin = createAdminClient();
  const payload = { internal_title: parsed.data.internalTitle, subject: parsed.data.subject, preheader: parsed.data.preheader || null, content: parsed.data.content, updated_by: profile.id };
  if (parsed.data.id) {
    const { data, error } = await admin.from("newsletter_campaigns").update(payload).eq("id", parsed.data.id).eq("status", "draft").select("id").maybeSingle();
    if (error || !data) return { success: false, message: "Somente rascunhos podem ser editados." };
    refresh(); return { success: true, message: "Campanha salva.", id: data.id };
  }
  const { data, error } = await admin.from("newsletter_campaigns").insert({ ...payload, created_by: profile.id, status: "draft" }).select("id").single();
  if (error || !data) return { success: false, message: "Não foi possível criar a campanha." };
  refresh(); return { success: true, message: "Rascunho criado.", id: data.id };
}

export async function cloneNewsletterCampaignAction(rawId: string) {
  const { profile } = await requirePermission("newsletter.manage_drafts");
  const parsed = newsletterCampaignIdSchema.safeParse(rawId);
  if (!parsed.success) return { success: false, message: "Campanha inválida." };
  const admin = createAdminClient();
  const { data: source } = await admin.from("newsletter_campaigns").select("internal_title, subject, preheader, content").eq("id", parsed.data).maybeSingle();
  if (!source) return { success: false, message: "Campanha não encontrada." };
  const { data, error } = await admin.from("newsletter_campaigns").insert({ ...source, internal_title: `Cópia de ${source.internal_title}`.slice(0, 160), status: "draft", created_by: profile.id, updated_by: profile.id }).select("id").single();
  if (error || !data) return { success: false, message: "Não foi possível clonar a campanha." };
  refresh(); return { success: true, message: "Campanha clonada.", id: data.id };
}

export async function deleteNewsletterCampaignDraftAction(rawId: string) {
  await requirePermission("newsletter.manage_drafts");
  const parsed = newsletterCampaignIdSchema.safeParse(rawId);
  if (!parsed.success) return { success: false, message: "Campanha inválida." };
  const { data, error } = await createAdminClient().from("newsletter_campaigns").delete().eq("id", parsed.data).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { success: false, message: "Somente rascunhos podem ser excluídos." };
  refresh(); return { success: true, message: "Rascunho excluído." };
}

export async function scheduleNewsletterCampaignAction(input: unknown) {
  const { profile } = await requirePermission("newsletter.send");
  const parsed = newsletterCampaignScheduleSchema.safeParse(input);
  if (!parsed.success || new Date(parsed.data.scheduledAt).getTime() <= Date.now()) return { success: false, message: "Escolha uma data futura válida." };
  const runtimeError = await campaignRuntimeError(parsed.data.id, true);
  if (runtimeError) return { success: false, message: runtimeError };
  await freezeCampaignAudience(parsed.data.id);
  const { data, error } = await createAdminClient().from("newsletter_campaigns").update({ status: "scheduled", scheduled_at: parsed.data.scheduledAt, updated_by: profile.id, pause_reason: null }).eq("id", parsed.data.id).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { success: false, message: "Não foi possível agendar a campanha." };
  refresh(); return { success: true, message: "Campanha agendada e audiência congelada." };
}

export async function sendNewsletterCampaignNowAction(rawId: string) {
  const { profile } = await requirePermission("newsletter.send");
  const parsed = newsletterCampaignIdSchema.safeParse(rawId);
  if (!parsed.success) return { success: false, message: "Campanha inválida." };
  const runtimeError = await campaignRuntimeError(parsed.data);
  if (runtimeError) return { success: false, message: runtimeError };
  await freezeCampaignAudience(parsed.data);
  const { data, error } = await createAdminClient().from("newsletter_campaigns").update({ status: "sending", scheduled_at: new Date().toISOString(), sending_started_at: new Date().toISOString(), updated_by: profile.id }).eq("id", parsed.data).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { success: false, message: "Não foi possível iniciar a campanha." };
  after(() => processCampaign(parsed.data));
  refresh(); return { success: true, message: "Envio iniciado em lotes." };
}

export async function cancelNewsletterCampaignAction(rawId: string) {
  const { profile } = await requirePermission("newsletter.send");
  const parsed = newsletterCampaignIdSchema.safeParse(rawId);
  if (!parsed.success) return { success: false, message: "Campanha inválida." };
  const admin = createAdminClient();
  const { data } = await admin.from("newsletter_campaigns").update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_by: profile.id }).eq("id", parsed.data).in("status", ["scheduled", "sending", "paused"]).select("id").maybeSingle();
  if (!data) return { success: false, message: "Esta campanha não pode ser cancelada." };
  await admin.from("newsletter_campaign_recipients").update({ status: "skipped", skipped_at: new Date().toISOString(), error_message: "Campanha cancelada." }).eq("campaign_id", parsed.data).in("status", ["pending", "processing", "failed"]);
  refresh(); return { success: true, message: "Campanha cancelada." };
}

export async function archiveNewsletterCampaignAction(rawId: string) {
  await requirePermission("newsletter.send");
  const parsed = newsletterCampaignIdSchema.safeParse(rawId);
  if (!parsed.success) return { success: false, message: "Campanha inválida." };
  const { data } = await createAdminClient().from("newsletter_campaigns").update({ archived_at: new Date().toISOString() }).eq("id", parsed.data).in("status", ["sent", "cancelled"]).select("id").maybeSingle();
  if (!data) return { success: false, message: "Somente campanhas enviadas ou canceladas podem ser arquivadas." };
  refresh(); return { success: true, message: "Campanha arquivada." };
}

export async function resumeNewsletterCampaignAction(rawId: string) {
  const { profile } = await requirePermission("newsletter.send");
  const parsed = newsletterCampaignIdSchema.safeParse(rawId);
  if (!parsed.success) return { success: false, message: "Campanha inválida." };
  const { data } = await createAdminClient().from("newsletter_campaigns").update({ status: "sending", pause_reason: null, last_error: null, updated_by: profile.id }).eq("id", parsed.data).eq("status", "paused").select("id").maybeSingle();
  if (!data) return { success: false, message: "Campanha não está pausada." };
  after(() => processCampaign(parsed.data)); refresh(); return { success: true, message: "Campanha retomada." };
}

export async function sendNewsletterCampaignTestAction(input: unknown) {
  await requirePermission("newsletter.send");
  const parsed = newsletterCampaignTestSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Informe um e-mail válido." };
  const campaign = await buildCampaignTestEmail(parsed.data.id);
  const result = await sendTransactionalEmail({ templateKey: "newsletter_campaign_test", to: parsed.data.email, subject: `[TESTE] ${campaign.subject}`, react: createElement(NewsletterCampaignEmail, { preheader: campaign.preheader ?? undefined, blocks: campaign.blocks, unsubscribeUrl: `${siteUrl()}/newsletter/resultado?status=teste` }), relatedEntityType: "newsletter_campaign", relatedEntityId: parsed.data.id });
  return { success: result.status === "sent", message: result.status === "sent" ? "Teste enviado." : result.status === "skipped" ? "Envio não configurado no servidor." : "O teste falhou no provedor." };
}

export async function addManualNewsletterSubscriberAction(input: unknown) {
  await requirePermission("newsletter.manage_subscribers");
  const parsed = manualSubscriberSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise o inscrito." };
  const admin = createAdminClient();
  const email = parsed.data.email.toLocaleLowerCase("pt-BR");
  const { data: existing } = await admin.from("newsletter_subscribers").select("id, status, confirmation_sent_at").eq("email", email).maybeSingle();
  if (existing?.status === "active") return { success: true, message: "O convite foi processado sem alterar uma inscrição ativa." };
  if (existing?.status === "pending" && existing.confirmation_sent_at && Date.now() - new Date(existing.confirmation_sent_at).getTime() < 15 * 60_000) return { success: false, message: "Aguarde 15 minutos antes de reenviar a confirmação." };
  const token = newToken(); const now = new Date();
  const { data: subscriber, error } = await admin.from("newsletter_subscribers").upsert({ name: parsed.data.name, email, source: "admin_manual", status: "pending", confirmation_token_hash: hashToken(token), confirmation_expires_at: new Date(now.getTime() + 24 * 60 * 60_000).toISOString(), confirmation_sent_at: now.toISOString(), confirmed_at: null, unsubscribe_token_hash: null, unsubscribed_at: null, metadata: { createdFrom: "admin" } }, { onConflict: "email" }).select("id").single();
  if (error || !subscriber) return { success: false, message: "Não foi possível cadastrar o inscrito." };
  await sendTransactionalEmail({ templateKey: "newsletter_double_opt_in", to: email, subject: "Confirme sua inscrição na Leehov Turismo", react: createElement(NewsletterDoubleOptInEmail, { name: parsed.data.name, confirmationUrl: `${siteUrl()}/api/newsletter/confirm?token=${encodeURIComponent(token)}` }), relatedEntityType: "newsletter_subscriber", relatedEntityId: subscriber.id });
  refresh(); return { success: true, message: "Inscrito pendente criado e confirmação solicitada." };
}
