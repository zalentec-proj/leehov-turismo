import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/features/auth/permissions";
import { channelSchema, stageSchema } from "./commercial";
import { cleanCampaignTag } from "./attribution";
import { buildReport, localDay, measurementCoverageStart, type ReportFilters, type ReportInput, type ReportLead } from "./report";
import { referencePattern } from "./whatsapp";

type Search = Record<string, string | string[] | undefined>;
const leadColumns = "id,created_at,marketing_attribution,metadata,attribution_basis,commercial_stage,source,is_test,caravan_id,assigned_to";
const eventColumns = "lead_id,kind,occurred_at,recorded_at,caravan_id,amount_minor,currency,attribution,attribution_basis";
const trafficColumns = "kind,visitor_id,session_id,caravan_id,linked_lead_id,occurred_at,attribution,is_test";
const step = 500;
const dayMs = 86400_000;
const calendar = (day: string, n: number) => new Date(Date.parse(day + "T12:00:00Z") + n * dayMs).toISOString().slice(0, 10);
const lower = (day: string) => day + "T00:00:00-03:00";
const first = (value: Search[string]) => Array.isArray(value) ? value[0] : value;
const key = (value: Search[string]) => z.uuid().safeParse(first(value)).data;
const date = (value: Search[string]) => z.iso.date().safeParse(first(value)).data;
const evidenceValues = z.enum(["observed", "reported", "legacy", "unknown"]);

export function parseReportFilters(raw: Search, now = new Date()): ReportFilters {
  const today = localDay(now);
  const minimum = calendar(today, -365);
  const wantedEnd = date(raw.to) ?? today;
  const to = wantedEnd > today ? today : wantedEnd < minimum ? minimum : wantedEnd;
  const wantedStart = date(raw.from) ?? calendar(to, -29);
  const from = wantedStart > to ? to : wantedStart < minimum ? minimum : wantedStart;
  return {
    from, to, mode: first(raw.mode) === "cohort" ? "cohort" : "event",
    basis: first(raw.basis) === "first" ? "first" : first(raw.basis) === "session" ? "session" : "conversion",
    records: first(raw.records) === "test" ? "test" : first(raw.records) === "all" ? "all" : "real",
    channel: channelSchema.safeParse(first(raw.channel)).data, evidence: evidenceValues.safeParse(first(raw.evidence)).data,
    caravan: key(raw.caravan), owner: key(raw.owner), stage: stageSchema.safeParse(first(raw.stage)).data,
    medium: cleanCampaignTag(first(raw.medium)), campaign: cleanCampaignTag(first(raw.campaign)) ?? cleanCampaignTag(first(raw.campaign), true),
  };
}

export function filtersQuery(filters: ReportFilters) {
  return new URLSearchParams(Object.entries(filters).flatMap(([k, v]) => v ? [[k, v]] : [])).toString();
}

async function pages<T>(load: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const items: T[] = [];
  for (let offset = 0; offset < 200_000; offset += step) {
    const { data, error } = await load(offset, offset + step - 1);
    if (error || !data) throw new Error("Não foi possível carregar os dados de conversões.");
    items.push(...data);
    if (data.length < step) return items;
  }
  throw new Error("O período tem muitos registros. Selecione um intervalo menor.");
}

function batches(ids: string[]) {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) out.push(ids.slice(i, i + 100));
  return out;
}

export async function getConversionReport(filters: ReportFilters) {
  const access = await requirePermission("conversions.view");
  const admin = createAdminClient();
  const start = lower(filters.from);
  const end = lower(calendar(filters.to, 1));
  const now = new Date();
  const coverageStart = measurementCoverageStart(now);
  const eventEnd = filters.mode === "cohort" ? now.toISOString()
    : new Date(Math.min(Date.parse(lower(calendar(filters.to, 31))), now.getTime())).toISOString();
  let firstMeasured = admin.from("site_measurement_events").select("occurred_at");
  if (filters.records !== "all") firstMeasured = firstMeasured.eq("is_test", filters.records === "test");
  const [newLeads, events, traffic, spend, caravans, owners, interests, firstEvent] = await Promise.all([
    pages((a, b) => admin.from("leads").select(leadColumns).gte("created_at", start).lt("created_at", end).order("id").range(a,b)),
    pages((a, b) => admin.from("lead_conversion_events").select(eventColumns).gte("occurred_at", start).lt("occurred_at", eventEnd)
      .in("kind", ["lead_created", "form_submitted", "contact_received", "quote_requested", "proposal_sent", "sale_won", "sale_cancelled"]).order("id").range(a,b)),
    pages((a, b) => {
      let query = admin.from("site_measurement_events").select(trafficColumns).gte("occurred_at", filters.from < coverageStart ? lower(coverageStart) : start).lt("occurred_at", end);
      if (filters.records !== "all") query = query.eq("is_test", filters.records === "test");
      if (filters.caravan) query = query.eq("caravan_id", filters.caravan);
      if (filters.mode === "cohort" || filters.owner || filters.stage) query = query.not("linked_lead_id","is",null);
      return query.order("id").range(a,b);
    }),
    pages((a, b) => admin.from("campaign_spend").select("day,channel,medium,campaign,currency,amount_minor").gte("day", filters.from).lte("day", filters.to)
      .order("day").order("channel").order("medium").order("campaign").order("currency").range(a,b)),
    pages((a,b) => admin.from("caravans").select("id,title").order("id").range(a,b)),
    pages((a,b) => admin.from("profiles").select("id,name").eq("active",true).order("id").range(a,b)),
    filters.caravan ? pages((a,b) => admin.from("lead_caravan_interests").select("lead_id,caravan_id").eq("caravan_id",filters.caravan!).order("lead_id").range(a,b)) : [],
    firstMeasured.order("occurred_at").limit(1).maybeSingle(),
  ]);
  if (firstEvent.error) throw new Error("Não foi possível determinar a cobertura da medição.");

  const known = new Set(newLeads.map((lead) => lead.id));
  const missing = new Set<string>();
  if (filters.mode === "event") {
    for (const event of events) if (Date.parse(event.occurred_at) < Date.parse(end) && !known.has(event.lead_id)) missing.add(event.lead_id);
    for (const visit of traffic) if (visit.linked_lead_id && !known.has(visit.linked_lead_id)) missing.add(visit.linked_lead_id);
  }
  const leads: ReportLead[] = [...newLeads];
  for (const ids of batches([...missing])) {
    const { data, error } = await admin.from("leads").select(leadColumns).in("id",ids);
    if (error || !data) throw new Error("Não foi possível carregar os leads.");
    leads.push(...data);
  }
  const report = buildReport({ filters, leads, events, traffic, spend, interests, asOf: now.toISOString(), measurementStart: firstEvent.data ? localDay(firstEvent.data.occurred_at) : null } satisfies ReportInput);
  const matching = leads.flatMap((lead) => {
    const origin = report.listedLeads.get(lead.id);
    return origin ? [{ ...lead, reportOrigin: origin.origin, reportEvidence: origin.evidence }] : [];
  }).sort((a,b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
  return { report, leads: matching, caravans, owners: owners.map((item) => ({ id: item.id, name: item.name || "Consultor" })), access, generatedAt: localDay(now) };
}

export async function getConversionLeadNames(ids: string[]) {
  await requirePermission("leads.view");
  const out: { id: string; name: string; phone: string }[] = [];
  const admin = createAdminClient();
  for (const part of batches(ids)) {
    const { data, error } = await admin.from("leads").select("id,name,phone").in("id",part);
    if (error || !data) throw new Error("Não foi possível carregar os dados dos leads.");
    out.push(...data);
  }
  return new Map(out.map((lead) => [lead.id, lead]));
}

export async function findContactReference(raw: string) {
  await requirePermission("leads.view");
  await requirePermission("leads.update");
  const reference = raw.trim().toUpperCase();
  if (!referencePattern.test(reference)) return null;
  const { data, error } = await createAdminClient().from("site_measurement_events")
    .select("reference,occurred_at,attribution,caravan_id,linked_lead_id,is_test")
    .eq("reference", reference).eq("kind","whatsapp").gte("occurred_at", new Date(Date.now() - 30 * dayMs).toISOString()).maybeSingle();
  if (error) throw new Error("Não foi possível pesquisar a referência.");
  return data;
}

export async function getCommercialLeadDetails(id: string) {
  await requirePermission("leads.view");
  const admin = createAdminClient();
  const [lead, caravans, references, interests] = await Promise.all([
    admin.from("leads").select("id,created_at,marketing_attribution,metadata,attribution_basis,commercial_stage,source,is_test,caravan_id,assigned_to,name,email,phone,next_action,loss_reason,proposal_minor,proposal_currency,sale_minor,sale_currency,contact_received_at,quote_requested_at,proposal_sent_at,closed_at").eq("id", id).maybeSingle(),
    pages((a,b) => admin.from("caravans").select("id,title").order("id").range(a,b)),
    pages((a,b) => admin.from("site_measurement_events").select("reference,occurred_at").eq("linked_lead_id",id).order("id").range(a,b)),
    pages((a,b) => admin.from("lead_caravan_interests").select("caravan_id").eq("lead_id",id).order("caravan_id").range(a,b)),
  ]);
  if (lead.error) throw new Error("Não foi possível carregar os dados comerciais.");
  return { lead: lead.data, caravans, references, interests: interests.map((item) => item.caravan_id) };
}
