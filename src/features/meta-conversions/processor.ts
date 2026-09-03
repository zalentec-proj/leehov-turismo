import "server-only";

import { fetchRdContact, fetchRdDeal } from "@/features/meta-conversions/rd-client";
import { parseRdDealWebhook, type RdDealSnapshot } from "@/features/meta-conversions/rd-payload";
import { sendMetaPurchase } from "@/features/meta-conversions/capi";
import { createAdminClient } from "@/lib/supabase/admin";

export type ConversionResult = { accepted: boolean; status: "sent" | "ignored" | "failed" | "duplicate" | "review_required"; message: string; eventId?: string };

const MAX_ATTEMPTS = 8;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 1000) : "Falha desconhecida ao enviar a conversão.";
}

function validDate(value: string | null) {
  return value && Number.isFinite(new Date(value).getTime()) ? value : null;
}

function ignoredKey(snapshot: RdDealSnapshot) {
  return `ignored:${snapshot.dealId}:${snapshot.transactionId ?? crypto.randomUUID()}`;
}

function eligibilityReason(snapshot: RdDealSnapshot, settings: { enabled: boolean; rd_source_id: string }, campaigns: Array<{ rd_campaign_id: string; name: string }>) {
  const campaign = campaigns.find((item) => item.rd_campaign_id === snapshot.campaignId);
  const reason = !settings.enabled ? "Envio desativado pelo administrador." :
    snapshot.status !== "won" ? "Negociação ainda não está ganha." :
    snapshot.sourceId !== settings.rd_source_id ? "Fonte não autorizada para conversão Meta." :
    !campaign ? "Roteiro não autorizado para conversão Meta." :
    !snapshot.value ? "Venda sem valor positivo." :
    !snapshot.contactIds.length ? "Negociação sem contato associado." :
    !validDate(snapshot.closedAt) ? "Venda sem data de fechamento válida." : null;
  return { reason, campaignName: campaign?.name ?? null };
}

async function logIgnored(snapshot: RdDealSnapshot, reason: string) {
  await createAdminClient().from("meta_conversion_events").insert({
    event_key: ignoredKey(snapshot), rd_transaction_uuid: snapshot.transactionId, rd_deal_id: snapshot.dealId,
    rd_contact_ids: snapshot.contactIds, rd_source_id: snapshot.sourceId, rd_source_name: snapshot.sourceName,
    rd_campaign_id: snapshot.campaignId, rd_campaign_name: snapshot.campaignName, closed_at: validDate(snapshot.closedAt),
    sale_value: snapshot.value, status: "ignored", last_error: reason, completed_at: new Date().toISOString(),
  });
}

async function getSettings() {
  const admin = createAdminClient();
  const [{ data: settings, error }, { data: campaigns, error: campaignError }] = await Promise.all([
    admin.from("meta_conversion_settings").select("*").eq("id", true).single(),
    admin.from("meta_conversion_campaigns").select("*").eq("active", true),
  ]);
  if (error || !settings || campaignError) throw new Error("A configuração de conversões Meta ainda não está disponível.");
  return { settings, campaigns: campaigns ?? [] };
}

async function deliverEvent(eventId: string, snapshot: RdDealSnapshot, pixelId: string, testEventCode: string | null): Promise<ConversionResult> {
  const admin = createAdminClient();
  await admin.from("meta_conversion_events").update({ status: "processing" }).eq("id", eventId);
  try {
    let contact = null;
    for (const contactId of snapshot.contactIds) {
      const candidate = await fetchRdContact(contactId);
      if (candidate.email || candidate.phone || candidate.externalId) { contact = candidate; break; }
    }
    if (!contact) throw new Error("O contato não possui dados mínimos de correspondência no RD.");
    const closedAt = validDate(snapshot.closedAt);
    if (!closedAt || !snapshot.value || !snapshot.campaignName) throw new Error("A negociação não contém os dados obrigatórios para Purchase.");
    const metaEventId = `rd_purchase_${snapshot.dealId}`;
    const response = await sendMetaPurchase({ eventId: metaEventId, eventTime: closedAt, value: snapshot.value, orderId: snapshot.dealId, routeName: snapshot.campaignName, contact, pixelId, testEventCode });
    await admin.from("meta_conversion_events").update({ status: "sent", meta_event_id: metaEventId, meta_response_status: response.status, last_error: null, completed_at: new Date().toISOString(), next_retry_at: null }).eq("id", eventId);
    return { accepted: true, status: "sent", message: "Purchase enviado à Meta.", eventId };
  } catch (error) {
    const message = errorMessage(error);
    const status = typeof error === "object" && error && "status" in error && typeof error.status === "number" ? error.status : null;
    const nextRetry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await admin.from("meta_conversion_events").update({ status: "failed", meta_response_status: status, last_error: message, next_retry_at: nextRetry }).eq("id", eventId);
    return { accepted: false, status: "failed", message, eventId };
  }
}

export async function processRdDealWebhook(payload: unknown): Promise<ConversionResult> {
  const snapshot = parseRdDealWebhook(payload);
  if (!snapshot) return { accepted: false, status: "ignored", message: "Payload sem negociação identificável." };
  const { settings, campaigns } = await getSettings();
  const { reason, campaignName } = eligibilityReason(snapshot, settings, campaigns);
  if (reason) {
    await logIgnored(snapshot, reason);
    return { accepted: true, status: "ignored", message: reason };
  }

  const admin = createAdminClient();
  const eventKey = `purchase:${snapshot.dealId}`;
  const { data: event, error } = await admin.from("meta_conversion_events").insert({
    event_key: eventKey, rd_transaction_uuid: snapshot.transactionId, rd_deal_id: snapshot.dealId,
    rd_contact_ids: snapshot.contactIds, rd_source_id: snapshot.sourceId, rd_source_name: snapshot.sourceName,
    rd_campaign_id: snapshot.campaignId, rd_campaign_name: campaignName, closed_at: validDate(snapshot.closedAt),
    sale_value: snapshot.value, status: "pending", attempts: 1,
  }).select("id").single();
  if (error?.code === "23505") {
    const { data: existing } = await admin.from("meta_conversion_events").select("id, sale_value").eq("event_key", eventKey).maybeSingle();
    if (existing && Number(existing.sale_value) !== snapshot.value) {
      await admin.from("meta_conversion_events").update({ status: "review_required", last_error: "O valor da venda mudou após a primeira conversão; revise antes de reenviar.", sale_value: snapshot.value }).eq("id", existing.id);
      return { accepted: true, status: "review_required", message: "Valor atualizado: revisão manual necessária.", eventId: existing.id };
    }
    return { accepted: true, status: "duplicate", message: "Essa venda já possui uma conversão registrada.", eventId: existing?.id };
  }
  if (error || !event) return { accepted: false, status: "failed", message: "Não foi possível registrar a conversão para envio." };
  return deliverEvent(event.id, { ...snapshot, campaignName }, settings.meta_pixel_id, settings.test_event_code);
}

export async function retryMetaConversionEvent(eventId: string): Promise<ConversionResult> {
  const admin = createAdminClient();
  const { data: event } = await admin.from("meta_conversion_events").select("id, rd_deal_id, attempts, status, sale_value").eq("id", eventId).maybeSingle();
  if (!event) return { accepted: false, status: "failed", message: "Evento não encontrado." };
  if (event.status !== "failed" || event.attempts >= MAX_ATTEMPTS) return { accepted: false, status: "failed", message: "Este evento não pode mais ser reenviado automaticamente." };
  try {
    const payload = await fetchRdDeal(event.rd_deal_id);
    const snapshot = parseRdDealWebhook(payload);
    const { settings, campaigns } = await getSettings();
    if (!snapshot) return { accepted: false, status: "failed", message: "A venda não está pronta para reenvio." };
    const { reason, campaignName } = eligibilityReason(snapshot, settings, campaigns);
    if (reason) {
      await admin.from("meta_conversion_events").update({ status: "ignored", last_error: reason, next_retry_at: null, completed_at: new Date().toISOString() }).eq("id", event.id);
      return { accepted: true, status: "ignored", message: reason, eventId };
    }
    if (Number(event.sale_value) !== snapshot.value) {
      await admin.from("meta_conversion_events").update({ status: "review_required", last_error: "O valor da venda mudou antes do reenvio; revise antes de enviar.", sale_value: snapshot.value, next_retry_at: null }).eq("id", event.id);
      return { accepted: true, status: "review_required", message: "Valor atualizado: revisão manual necessária.", eventId };
    }
    await admin.from("meta_conversion_events").update({ attempts: event.attempts + 1, status: "pending", last_error: null, next_retry_at: null }).eq("id", event.id);
    return deliverEvent(event.id, { ...snapshot, campaignName }, settings.meta_pixel_id, settings.test_event_code);
  } catch (error) {
    const message = errorMessage(error);
    await admin.from("meta_conversion_events").update({ last_error: message, next_retry_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() }).eq("id", event.id);
    return { accepted: false, status: "failed", message, eventId };
  }
}

export async function retryFailedMetaConversions(limit = 20) {
  const { data } = await createAdminClient().from("meta_conversion_events").select("id").eq("status", "failed").lte("next_retry_at", new Date().toISOString()).order("created_at").limit(limit);
  return Promise.all((data ?? []).map((event) => retryMetaConversionEvent(event.id)));
}

export async function sendMetaTestEvent(testEventCode: string | null) {
  const { settings } = await getSettings();
  if (!testEventCode) throw new Error("Informe o código de teste exibido no Gerenciador de Eventos.");
  return sendMetaPurchase({
    eventId: `leehov_meta_test_${crypto.randomUUID()}`,
    eventTime: new Date().toISOString(), value: 1, orderId: `leehov-meta-test-${crypto.randomUUID()}`, routeName: "Teste técnico Leehov",
    contact: { externalId: `leehov-meta-test-${crypto.randomUUID()}` }, pixelId: settings.meta_pixel_id, testEventCode,
  });
}
