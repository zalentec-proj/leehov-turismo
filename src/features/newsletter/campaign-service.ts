import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createElement } from "react";
import { NewsletterCampaignEmail } from "@/emails/templates/newsletter-campaign-email";
import type { NewsletterCampaignBlock } from "@/features/newsletter/types";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { createEmailAssetToken } from "@/lib/email/asset-signing";
import { createAdminClient } from "@/lib/supabase/admin";

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

export async function freezeCampaignAudience(campaignId: string) {
  const admin = createAdminClient();
  const { data: campaign } = await admin.from("newsletter_campaigns").select("audience_frozen_at").eq("id", campaignId).maybeSingle();
  if (!campaign) throw new Error("Campanha não encontrada.");
  if (campaign.audience_frozen_at) return;
  const { data: subscribers, error } = await admin.from("newsletter_subscribers").select("id, name, email").eq("status", "active");
  if (error) throw error;
  if (subscribers?.length) {
    const { error: insertError } = await admin.from("newsletter_campaign_recipients").upsert(subscribers.map((subscriber) => ({
      campaign_id: campaignId, subscriber_id: subscriber.id, recipient_name: subscriber.name, recipient_email: subscriber.email, status: "pending" as const,
    })), { onConflict: "campaign_id,recipient_email", ignoreDuplicates: true });
    if (insertError) throw insertError;
  }
  await admin.from("newsletter_campaigns").update({ audience_frozen_at: new Date().toISOString() }).eq("id", campaignId).is("audience_frozen_at", null);
}

async function contentWithAssetUrls(content: NewsletterCampaignBlock[]) {
  const assetIds = content.filter((block) => block.type === "image" && block.data.assetId).map((block) => block.data.assetId as string);
  const admin = createAdminClient();
  const { data } = assetIds.length ? await admin.from("media_assets").select("id").in("id", assetIds) : { data: [] };
  const existing = new Set((data ?? []).map((asset) => asset.id));
  return content.map((block) => {
    if (block.type !== "image" || !block.data.assetId || !existing.has(block.data.assetId)) return block;
    const token = createEmailAssetToken(block.data.assetId);
    return { ...block, data: { ...block.data, url: `${siteUrl()}/api/email-assets/${block.data.assetId}?token=${encodeURIComponent(token)}` } };
  });
}

async function processRecipient(campaign: { id: string; subject: string; preheader: string | null; content: unknown }, recipientId: string) {
  const admin = createAdminClient();
  const { data: recipient } = await admin.from("newsletter_campaign_recipients").update({ status: "processing", processing_started_at: new Date().toISOString() }).eq("id", recipientId).in("status", ["pending", "failed"]).lt("attempts", 3).select("id, subscriber_id, recipient_name, recipient_email, attempts").maybeSingle();
  if (!recipient) return;
  const { data: subscriber } = recipient.subscriber_id ? await admin.from("newsletter_subscribers").select("status").eq("id", recipient.subscriber_id).maybeSingle() : { data: null };
  if (!subscriber || subscriber.status !== "active") {
    await admin.from("newsletter_campaign_recipients").update({ status: "skipped", skipped_at: new Date().toISOString(), error_message: "Inscrição não está mais ativa." }).eq("id", recipient.id);
    return;
  }
  const token = newToken();
  const attempts = recipient.attempts + 1;
  await admin.from("newsletter_campaign_recipients").update({ attempts, unsubscribe_token_hash: hashToken(token) }).eq("id", recipient.id);
  const blocks = await contentWithAssetUrls(campaign.content as unknown as NewsletterCampaignBlock[]);
  const result = await sendTransactionalEmail({
    templateKey: "newsletter_campaign", to: recipient.recipient_email, subject: campaign.subject,
    react: createElement(NewsletterCampaignEmail, { preheader: campaign.preheader ?? undefined, blocks, unsubscribeUrl: `${siteUrl()}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}` }),
    relatedEntityType: "newsletter_campaign", relatedEntityId: campaign.id, metadata: { recipientId: recipient.id },
  });
  if (result.status === "sent") {
    await admin.from("newsletter_campaign_recipients").update({ status: "sent", provider_message_id: result.providerMessageId ?? null, sent_at: new Date().toISOString(), processing_started_at: null, next_attempt_at: null, error_message: null }).eq("id", recipient.id);
    return;
  }
  const quota = /quota|rate.?limit|too many|daily limit/i.test(result.errorMessage ?? "");
  await admin.from("newsletter_campaign_recipients").update({ status: "failed", processing_started_at: null, next_attempt_at: attempts < 3 ? new Date(Date.now() + attempts * 5 * 60_000).toISOString() : null, error_message: (result.errorMessage || "Falha no provedor.").slice(0, 1000) }).eq("id", recipient.id);
  if (quota) await admin.from("newsletter_campaigns").update({ status: "paused", pause_reason: "Cota ou limite do provedor atingido.", last_error: result.errorMessage?.slice(0, 1000) ?? null }).eq("id", campaign.id);
}

export async function processCampaign(campaignId: string, batchSize = 20) {
  const admin = createAdminClient();
  const { data: campaign } = await admin.from("newsletter_campaigns").select("id, subject, preheader, content, status").eq("id", campaignId).maybeSingle();
  if (!campaign || campaign.status !== "sending") return { processed: 0 };
  const { data: recipients } = await admin.from("newsletter_campaign_recipients").select("id").eq("campaign_id", campaignId).in("status", ["pending", "failed"]).lt("attempts", 3).or(`next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()}`).order("created_at").limit(batchSize);
  for (const recipient of recipients ?? []) {
    const { data: state } = await admin.from("newsletter_campaigns").select("status").eq("id", campaignId).single();
    if (state?.status !== "sending") break;
    await processRecipient(campaign, recipient.id);
    await new Promise((resolve) => setTimeout(resolve, 220));
  }
  const { count: remaining } = await admin.from("newsletter_campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).or("status.eq.pending,status.eq.processing,and(status.eq.failed,attempts.lt.3)");
  if (!remaining) await admin.from("newsletter_campaigns").update({ status: "sent", sent_at: new Date().toISOString(), pause_reason: null }).eq("id", campaignId).eq("status", "sending");
  return { processed: recipients?.length ?? 0 };
}

export async function processDueCampaigns() {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: due } = await admin.from("newsletter_campaigns").select("id").eq("status", "scheduled").lte("scheduled_at", now).limit(5);
  for (const item of due ?? []) await admin.from("newsletter_campaigns").update({ status: "sending", sending_started_at: now }).eq("id", item.id).eq("status", "scheduled");
  const { data: sending } = await admin.from("newsletter_campaigns").select("id").eq("status", "sending").limit(5);
  let processed = 0;
  for (const item of sending ?? []) processed += (await processCampaign(item.id)).processed;
  return { campaigns: sending?.length ?? 0, recipients: processed };
}

export async function buildCampaignTestEmail(campaignId: string) {
  const { data } = await createAdminClient().from("newsletter_campaigns").select("subject, preheader, content").eq("id", campaignId).maybeSingle();
  if (!data) throw new Error("Campanha não encontrada.");
  return { ...data, blocks: await contentWithAssetUrls(data.content as unknown as NewsletterCampaignBlock[]) };
}
