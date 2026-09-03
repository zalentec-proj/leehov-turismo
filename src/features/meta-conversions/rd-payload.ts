import { createHash } from "node:crypto";

export type RdDealSnapshot = {
  dealId: string;
  eventName: string | null;
  transactionId: string | null;
  status: string;
  sourceId: string | null;
  sourceName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  contactIds: string[];
  closedAt: string | null;
  value: number | null;
};

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function first(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "") ?? null;
}

function text(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return String(value).trim() || null;
  const item = record(value);
  const nested = first(item.id, item.uuid, item.value, item.name, item.label, item.title);
  return nested === null ? null : text(nested);
}

function parseMoney(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function contactIds(value: unknown): string[] {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(items.map((item) => {
    const object = record(item);
    return text(first(object.id, object.contact_id, object.uuid, item));
  }).filter((item): item is string => Boolean(item)))];
}

function allContactIds(...values: unknown[]): string[] {
  return [...new Set(values.flatMap((value) => contactIds(value)))];
}

/** Reads the official RD webhook envelope without persisting its raw payload. */
export function parseRdDealWebhook(payload: unknown): RdDealSnapshot | null {
  const envelope = record(payload);
  const deal = record(first(envelope.document, envelope.deal, envelope.data, payload));
  const source = record(first(deal.source, deal.deal_source, deal.origin));
  const campaign = record(first(deal.campaign, deal.deal_campaign, deal.marketing_campaign));
  const dealId = text(first(deal.id, deal.uuid, deal.deal_id));
  if (!dealId) return null;

  return {
    dealId,
    eventName: text(envelope.event_name),
    transactionId: text(first(envelope.transaction_uuid, envelope.transaction_id, envelope.id)),
    status: (text(first(deal.status, deal.deal_status, deal.status_name)) ?? "").toLowerCase(),
    sourceId: text(first(deal.source_id, deal.deal_source_id, source.id, source.uuid)),
    sourceName: text(first(deal.source_name, deal.deal_source_name, source.name, source.label)),
    campaignId: text(first(deal.campaign_id, deal.deal_campaign_id, campaign.id, campaign.uuid)),
    campaignName: text(first(deal.campaign_name, deal.deal_campaign_name, campaign.name, campaign.label)),
    // CRM v2 can emit an empty `contacts` relation together with populated
    // `contact_ids`. Merge each supported shape instead of treating an empty
    // relation as a definitive absence of a contact.
    contactIds: allContactIds(deal.contacts, deal.contact_ids, deal.contact_id, deal.person),
    closedAt: text(first(deal.closed_at, deal.won_at, deal.close_date, deal.closed_date)),
    // amount_total is the documented field in the RD CRM deal webhook.
    value: parseMoney(first(deal.amount_total, deal.amount_unique, deal.value, deal.amount, deal.deal_value, deal.total_value)),
  };
}

export function isRdDealUpdatedWebhook(payload: unknown) {
  return text(record(payload).event_name) === "crm_deal_updated";
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeBrazilPhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 13) return `+${digits}`;
  if ((digits.length === 10 || digits.length === 11) && /^[1-9]/.test(digits)) return `+55${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : "";
}

export function hashMetaIdentifier(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}
