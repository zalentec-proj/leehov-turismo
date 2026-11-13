import { classifyTouch, cleanTouch, isChannel, type AttributionSnapshot, type Channel, type ClassifiedTouch } from "./attribution";
import type { Currency } from "./commercial";

export type ReportFilters = {
  from: string; to: string; mode: "event" | "cohort"; basis: "first" | "conversion" | "session";
  records: "real" | "test" | "all"; channel?: Channel; medium?: string; campaign?: string; caravan?: string;
  owner?: string; stage?: string; evidence?: "observed" | "reported" | "legacy" | "unknown";
};
export type ReportLead = {
  id: string; created_at: string; marketing_attribution: unknown; attribution_basis: string | null;
  metadata: unknown; commercial_stage: string | null; source: string; is_test: boolean; caravan_id: string | null; assigned_to: string | null;
};
export type ReportEvent = {
  lead_id: string; kind: string; occurred_at: string; recorded_at: string; caravan_id: string | null;
  amount_minor: number | null; currency: string | null; attribution?: unknown; attribution_basis?: string | null;
};
export type ReportTraffic = {
  kind: string; visitor_id: string; session_id: string; caravan_id: string | null; linked_lead_id: string | null;
  occurred_at: string; attribution: unknown; is_test: boolean;
};
export type Spend = { day: string; channel: string; medium: string; campaign: string; currency: string; amount_minor: number };
export type ReportInput = {
  filters: ReportFilters; leads: ReportLead[]; events: ReportEvent[]; traffic: ReportTraffic[]; spend: Spend[];
  interests: { lead_id: string; caravan_id: string }[]; asOf?: string; measurementStart?: string | null;
};
const tz = "America/Sao_Paulo";
const dayFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
export const localDay = (value: string | Date) => dayFormatter.format(new Date(value));
export function measurementCoverageStart(now: Date) {
  // Use a full local calendar day: the oldest day may have been partially purged.
  return localDay(new Date(now.getTime() - 179 * 86400_000));
}
const record = (v: unknown): Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v) ? v as Record<string, unknown> : {};
const emptyOrigin: ClassifiedTouch = { channel: "unknown" };
export const dateMatches = (date: string, f: ReportFilters) => date >= f.from && date <= f.to;
const isCurrency = (value: unknown): value is Currency => value === "BRL" || value === "USD" || value === "EUR";
const moneyAdd = (totals: Partial<Record<Currency, number>>, currency: string | null, amount: number) => {
  if (isCurrency(currency)) totals[currency] = (totals[currency] ?? 0) + amount;
};

export function originFrom(snapshot: unknown, basis: ReportFilters["basis"]): ClassifiedTouch {
  const value = record(record(snapshot)[basis]);
  return isChannel(value.channel) ? { ...cleanTouch(value), channel: value.channel } : emptyOrigin;
}

export function attributionOfLead(lead: ReportLead): { attribution: AttributionSnapshot; evidence: NonNullable<ReportFilters["evidence"]> } {
  if (lead.attribution_basis === "reported" || lead.attribution_basis === "observed") {
    return {
      attribution: { first: originFrom(lead.marketing_attribution, "first"), session: originFrom(lead.marketing_attribution, "session"), conversion: originFrom(lead.marketing_attribution, "conversion") },
      evidence: lead.attribution_basis,
    };
  }
  const meta = record(lead.metadata);
  const touch = cleanTouch({ source: meta.utmSource, medium: meta.utmMedium, campaign: meta.utmCampaign, content: meta.utmContent, term: meta.utmTerm });
  return Object.keys(touch).length ? { attribution: { conversion: classifyTouch(touch) }, evidence: "legacy" } : { attribution: {}, evidence: "unknown" };
}

export function leadMatches(lead: ReportLead, f: ReportFilters, interests?: Set<string>) {
  if ((f.records === "real" && lead.is_test) || (f.records === "test" && !lead.is_test)) return false;
  if (f.owner && lead.assigned_to !== f.owner || f.stage && (lead.commercial_stage ?? "new") !== f.stage) return false;
  return !f.caravan || lead.caravan_id === f.caravan || Boolean(interests?.has(lead.id));
}

export function originMatches(touch: ClassifiedTouch, f: ReportFilters, evidence: NonNullable<ReportFilters["evidence"]>) {
  return (!f.channel || touch.channel === f.channel)
    && (!f.medium || touch.medium === f.medium.toLowerCase())
    && (!f.campaign || touch.campaign === f.campaign || touch.campaignId === f.campaign)
    && (!f.evidence || evidence === f.evidence);
}

function eventAttribution(row: ReportEvent, lead: ReportLead, basis: ReportFilters["basis"], mode: ReportFilters["mode"]) {
  const known = attributionOfLead(lead);
  const useSnapshot = mode === "event" && row.attribution !== undefined;
  return {
    origin: originFrom(useSnapshot ? row.attribution : known.attribution, basis),
    evidence: useSnapshot ? (row.attribution_basis === "observed" || row.attribution_basis === "reported" ? row.attribution_basis : "unknown" as const) : known.evidence,
  };
}

type Counters = {
  visitors: number; sessions: number; views: number; clicks: number; attempts: number; linkedAttempts: number;
  forms: number; leads: number; contact: number; quotes: number; proposals: number; sales: number; cancelled: number;
};
const zero = (): Counters => ({ visitors: 0, sessions: 0, views: 0, clicks: 0, attempts: 0, linkedAttempts: 0, forms: 0, leads: 0, contact: 0, quotes: 0, proposals: 0, sales: 0, cancelled: 0 });
const commercialMetric: Record<string, keyof Counters> = { form_submitted: "forms", contact_received: "contact", quote_requested: "quotes", proposal_sent: "proposals", sale_won: "sales", sale_cancelled: "cancelled" };
const groupKey = (t: ClassifiedTouch) => JSON.stringify([t.channel, t.medium ?? "", t.campaignId ?? t.campaign ?? ""]);
const dateGroup = (day: string, group: string) => day + "|" + group;
const rate = (n: number, d: number) => d > 0 ? n / d : null;

export function buildReport({ filters: f, leads, events, traffic, spend, interests, asOf, measurementStart }: ReportInput) {
  const interested = new Set(interests.filter((item) => item.caravan_id === f.caravan).map((item) => item.lead_id));
  const eligible = new Map(leads.filter((item) => leadMatches(item, f, interested)).map((item) => [item.id, item]));
  const scoped = new Map([...eligible].map(([id, lead]) => [id, attributionOfLead(lead)]));
  const creationEvents = new Map(events.filter((row) => row.kind === "lead_created").map((row) => [row.lead_id,row]));
  const cohorts = new Set<string>();
  const visitors = new Set<string>(), sessions = new Set<string>(), attempts = new Set<string>(), linkedAttempts = new Set<string>();
  const viewSessions = new Set<string>(), clickSessions = new Set<string>();
  const totals = zero();
  const revenue: Partial<Record<Currency, number>> = {};
  const origins = new Map<string, { channel: Channel; medium: string; campaign: string; campaignId: string; counts: Counters; revenue: Partial<Record<Currency, number>> }>();
  const caravans = new Map<string, { id: string; views: number; clicks: number; leads: number; sales: number }>();
  const days = new Map<string, Counters>();
  const costUnits = new Map<string, { attempts: Set<string>; leads: Set<string>; quotes: Set<string>; sales: Partial<Record<Currency, number>>; revenue: Partial<Record<Currency, number>> }>();
  const cohortByDay = new Map<string, { quotes: number; proposals: number; sales: number }>();
  const funnelEvents = new Map<string, { kind: string; at: number }[]>();
  const listedLeads = new Map<string, { origin: ClassifiedTouch; evidence: NonNullable<ReportFilters["evidence"]>; at: number }>();
  const today = asOf ?? new Date().toISOString();
  const cutoff = Date.parse(today);
  const retained = measurementCoverageStart(new Date(cutoff));
  const coverageStart = measurementStart === null ? null : measurementStart && measurementStart > retained ? measurementStart : retained;
  const coversFullPeriod = coverageStart !== null && f.from >= coverageStart;
  const currentDay = localDay(new Date(cutoff));

  const getDay = (day: string) => {
    if (!days.has(day)) days.set(day, zero());
    return days.get(day)!;
  };
  const getOrigin = (origin: ClassifiedTouch) => {
    const key = groupKey(origin);
    if (!origins.has(key)) origins.set(key, {
      channel: origin.channel, medium: origin.medium ?? "", campaign: origin.campaign ?? "", campaignId: origin.campaignId ?? "",
      counts: zero(), revenue: {},
    });
    return origins.get(key)!;
  };
  const getCaravan = (id: string | null) => {
    if (!id) return null;
    if (!caravans.has(id)) caravans.set(id, { id, views: 0, clicks: 0, leads: 0, sales: 0 });
    return caravans.get(id)!;
  };
  const getCostUnit = (origin: ClassifiedTouch, day: string) => {
    const key = dateGroup(day, groupKey(origin));
    if (!costUnits.has(key)) costUnits.set(key, { attempts: new Set(), leads: new Set(), quotes: new Set(), sales: {}, revenue: {} });
    return costUnits.get(key)!;
  };

  for (const lead of eligible.values()) {
    const known = scoped.get(lead.id)!;
    const creation = creationEvents.get(lead.id);
    const { origin, evidence } = f.mode === "event" && creation
      ? eventAttribution(creation, lead, f.basis, f.mode)
      : { origin: originFrom(known.attribution, f.basis), evidence: known.evidence };
    const day = localDay(lead.created_at);
    if (!dateMatches(day, f) || !originMatches(origin, f, evidence)) continue;
    cohorts.add(lead.id);
    listedLeads.set(lead.id, { origin, evidence, at: Date.parse(lead.created_at) });
    totals.leads++;
    getDay(day).leads++;
    getOrigin(origin).counts.leads++;
    if (lead.caravan_id && (!f.caravan || f.caravan === lead.caravan_id)) getCaravan(lead.caravan_id)!.leads++;
    if (evidence === "observed") {
      getCostUnit(origin, day).leads.add(lead.id);
    }
  }

  // The traffic section is always by event date. Commercial filters scope it
  // to clicks attached to the selected leads, never to anonymous visitors.
  const trafficIsComparable = f.mode === "event" && !f.owner && !f.stage && (!f.evidence || f.evidence === "observed");
  const attemptGroups = new Map<string, Set<string>>();
  for (const event of traffic) {
    if (f.records === "real" && event.is_test || f.records === "test" && !event.is_test) continue;
    if (f.caravan && f.caravan !== event.caravan_id) continue;
    if (f.mode === "cohort" || f.owner || f.stage) {
      if (!event.linked_lead_id || !(f.mode === "cohort" ? cohorts.has(event.linked_lead_id) : eligible.has(event.linked_lead_id))) continue;
    }
    const day = localDay(event.occurred_at);
    if (!dateMatches(day, f)) continue;
    const origin = originFrom(event.attribution, f.basis);
    if (!originMatches(origin, f, "observed")) continue;
    visitors.add(event.visitor_id);
    sessions.add(event.session_id);
    const byOrigin = getOrigin(origin).counts;
    if (event.kind === "page" && event.caravan_id) {
      viewSessions.add(event.session_id);
      totals.views++; getDay(day).views++; byOrigin.views++; getCaravan(event.caravan_id)!.views++;
    }
    if (event.kind !== "whatsapp") continue;
    clickSessions.add(event.session_id);
    totals.clicks++; getDay(day).clicks++; byOrigin.clicks++;
    const caravan = getCaravan(event.caravan_id);
    if (caravan) caravan.clicks++;
    const key = event.session_id + "/" + (event.caravan_id ?? "-");
    attempts.add(key);
    if (event.linked_lead_id && eligible.has(event.linked_lead_id)) linkedAttempts.add(key);
    const group = groupKey(origin);
    const set = attemptGroups.get(group) ?? new Set<string>();
    set.add(key);
    attemptGroups.set(group, set);
    getCostUnit(origin, day).attempts.add(key);
  }

  for (const [key, set] of attemptGroups) origins.get(key)!.counts.attempts = set.size;
  totals.visitors = visitors.size;
  totals.sessions = sessions.size;
  totals.attempts = attempts.size;
  totals.linkedAttempts = linkedAttempts.size;
  for (const event of events) {
    const at = Date.parse(event.occurred_at);
    if (at > cutoff) continue;
    const lead = eligible.get(event.lead_id);
    if (!lead) continue;
    const day = localDay(event.occurred_at);
    const { origin, evidence } = eventAttribution(event, lead, f.basis, f.mode);
    const matchedOrigin = originMatches(origin, f, evidence);
    if (cohorts.has(lead.id) && (!f.caravan || event.caravan_id === f.caravan)) {
      const list = funnelEvents.get(lead.id) ?? [];
      list.push({ kind: event.kind, at });
      funnelEvents.set(lead.id, list);
    }
    if (!matchedOrigin || f.caravan && event.caravan_id !== f.caravan) continue;
    if (f.mode === "cohort" ? !cohorts.has(lead.id) || at < Date.parse(lead.created_at) : !dateMatches(day, f)) continue;
    const metric = commercialMetric[event.kind];
    if (!metric) continue;
    if (f.mode === "event" && (!listedLeads.has(lead.id) || at >= listedLeads.get(lead.id)!.at)) {
      listedLeads.set(lead.id, { origin, evidence, at });
    }
    const group = getOrigin(origin);
    totals[metric]++;
    group.counts[metric]++;
    if (f.mode === "event") getDay(day)[metric]++;
    else if (metric === "quotes" || metric === "proposals" || metric === "sales") {
      const creationDay = localDay(lead.created_at);
      const unit = cohortByDay.get(creationDay) ?? { quotes: 0, proposals: 0, sales: 0 };
      unit[metric]++;
      cohortByDay.set(creationDay, unit);
    }
    if (evidence === "observed" && event.kind === "quote_requested") {
      getCostUnit(origin, day).quotes.add(lead.id);
    }
    if ((event.kind === "sale_won" || event.kind === "sale_cancelled") && event.amount_minor && isCurrency(event.currency)) {
      const signed = event.kind === "sale_won" ? event.amount_minor : -event.amount_minor;
      moneyAdd(revenue, event.currency, signed);
      moneyAdd(group.revenue, event.currency, signed);
      if (event.kind === "sale_won") {
        const caravan = getCaravan(event.caravan_id);
        if (caravan) caravan.sales++;
      }
      if (evidence === "observed") {
        const unit = getCostUnit(origin, day);
        moneyAdd(unit.revenue, event.currency, signed);
        if (event.kind === "sale_won") moneyAdd(unit.sales, event.currency, 1);
      }
    }
  }

  // Cohort transitions are ordered and observed over a complete 30-day window.
  const chain = ["contact_received", "quote_requested", "proposal_sent", "sale_won"];
  const stageCounts = [0, 0, 0, 0, 0];
  let pending = 0;
  for (const id of cohorts) {
    const start = new Date(eligible.get(id)!.created_at).getTime();
    const end = start + 30 * 86400_000;
    if (end > cutoff) { pending++; continue; }
    stageCounts[0]++;
    let after = start;
    const events = [...(funnelEvents.get(id) ?? [])].sort((a, b) => a.at - b.at);
    for (const [i, stage] of chain.entries()) {
      const reached = events.find((event) => event.kind === stage && event.at >= after && event.at <= end);
      if (!reached) break;
      after = reached.at;
      stageCounts[i + 1]++;
    }
  }

  const costs = new Map<Currency, { currency: Currency; spend: number; attempts: Set<string>; leads: Set<string>; quotes: Set<string>; sales: number; revenue: number; days: Set<string>; matched: number }>();
  if (trafficIsComparable && !f.caravan && f.records === "real" && f.basis === "conversion") {
    for (const item of spend) {
      if (!isChannel(item.channel) || !isCurrency(item.currency) || !dateMatches(item.day, f) || !coverageStart || item.day < coverageStart || item.day >= currentDay) continue;
      const origin = { channel: item.channel, medium: item.medium || undefined, campaign: item.campaign || undefined };
      const group = origins.get(groupKey(origin));
      if (!originMatches(origin, { ...f, campaign: undefined }, "observed") ||
        f.campaign && f.campaign !== item.campaign && group?.campaign !== f.campaign) continue;
      const cost = costs.get(item.currency) ?? { currency: item.currency, spend: 0, attempts: new Set(), leads: new Set(), quotes: new Set(), sales: 0, revenue: 0, days: new Set(), matched: 0 };
      cost.spend += item.amount_minor;
      cost.days.add(item.day);
      const unit = costUnits.get(dateGroup(item.day, groupKey(origin)));
      if (unit) {
        cost.matched++;
        for (const key of unit.attempts) cost.attempts.add(key);
        for (const id of unit.leads) cost.leads.add(id);
        for (const id of unit.quotes) cost.quotes.add(id);
        cost.sales += unit.sales[item.currency] ?? 0;
        cost.revenue += unit.revenue[item.currency] ?? 0;
      }
      costs.set(item.currency, cost);
    }
  }

  if (f.mode === "cohort") for (const [day, counts] of cohortByDay) Object.assign(getDay(day), counts);
  return {
    totals, revenue, pending, listedLeads, measuredTraffic: trafficIsComparable && Boolean(coverageStart), coverageStart, coversFullPeriod,
    navigationRates: trafficIsComparable && coversFullPeriod ? [
      { label: "Sessões com visualização de caravana", count: viewSessions.size, denominator: sessions.size, rate: rate(viewSessions.size,sessions.size) },
      { label: "Sessões com clique no WhatsApp", count: clickSessions.size, denominator: sessions.size, rate: rate(clickSessions.size,sessions.size) },
      { label: "Tentativas vinculadas a um lead", count: linkedAttempts.size, denominator: attempts.size, rate: rate(linkedAttempts.size,attempts.size) },
    ] : [],
    funnel: stageCounts.map((count, i) => ({ count, denominator: i ? stageCounts[i - 1] : null, rate: i ? rate(count, stageCounts[i - 1]) : null })),
    origins: [...origins.values()].sort((a, b) => b.counts.leads - a.counts.leads || b.counts.sales - a.counts.sales || b.counts.clicks - a.counts.clicks),
    caravans: [...caravans.values()].sort((a, b) => b.sales - a.sales || b.leads - a.leads || b.views - a.views),
    days: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([day, counts]) => ({ day, ...counts })),
    costs: [...costs.values()].map((cost) => ({ ...cost, attempts: cost.attempts.size, leads: cost.leads.size, quotes: cost.quotes.size, days: [...cost.days].sort(), roas: cost.matched ? rate(cost.revenue, cost.spend) : null })),
  };
}

export function csv(rows: (string | number | null | undefined)[][]) {
  return "\uFEFF" + rows.map((row) => row.map((item) => {
    let value = String(item ?? "");
    if (/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(value)) value = "'" + value;
    return '"' + value.replaceAll('"', '""') + '"';
  }).join(";")).join("\r\n") + "\r\n";
}
