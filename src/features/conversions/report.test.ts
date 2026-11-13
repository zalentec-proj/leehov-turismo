import { describe, expect, it } from "vitest";
import { buildReport, csv, type ReportInput } from "./report";

const date = "2026-11-13T13:00:00Z";
const scope = { conversion: { channel: "google_ads" as const, campaign: "Ásia", medium: "cpc" }, first: { channel: "openai_ads" as const } };
const lead = { id: "one", created_at: date, marketing_attribution: scope, metadata: {}, attribution_basis: "observed", commercial_stage: "won", source: "whatsapp", is_test: false, caravan_id: null, assigned_to: null };
const row = { lead_id: "one", occurred_at: date, recorded_at: date, caravan_id: null, amount_minor: null, currency: null };
const click = { kind: "whatsapp", visitor_id: "visitor", session_id: "session", caravan_id: null, occurred_at: date, linked_lead_id: "one", attribution: scope, is_test: false };
const input: ReportInput = {
  asOf: "2026-11-14T12:00:00Z",
  filters: { from: "2026-11-13", to: "2026-11-13", mode: "event", basis: "conversion", records: "real" },
  leads: [lead],
  events: [
    { ...row, kind: "contact_received" }, { ...row, kind: "quote_requested" }, { ...row, kind: "sale_won", amount_minor: 100000, currency: "BRL" },
    { ...row, kind: "sale_won", amount_minor: 50000, currency: "USD" }, { ...row, kind: "sale_cancelled", amount_minor: 20000, currency: "BRL" },
  ],
  traffic: [click, click, { ...click, kind: "page" }, { ...click, is_test: true }, { ...click, linked_lead_id: null, session_id: "unlinked" }],
  spend: [
    { day: "2026-11-13", channel: "google_ads", medium: "cpc", campaign: "Ásia", currency: "BRL", amount_minor: 20000 },
    { day: "2026-11-12", channel: "google_ads", medium: "cpc", campaign: "Ásia", currency: "BRL", amount_minor: 90000 },
  ],
  interests: [],
};

describe("relatório de conversões", () => {
  it("não transforma cliques anônimos em leads e mantém moedas separadas", () => {
    const result = buildReport(input);
    expect(result.totals).toMatchObject({ visitors: 1, sessions: 2, clicks: 3, attempts: 2, linkedAttempts: 1, leads: 1, contact: 1, quotes: 1, sales: 2, cancelled: 1 });
    expect(result.revenue).toEqual({ BRL: 80000, USD: 50000 });
    expect(result.costs[0]).toMatchObject({ currency: "BRL", spend: 20000, attempts: 2, leads: 1, quotes: 1, sales: 1, revenue: 80000, days: ["2026-11-13"] });
  });

  it("uma venda antiga aparece por evento, mas não na coorte criada no período", () => {
    const later = { ...input, leads: [{ ...lead, created_at: "2026-11-01T13:00:00Z" }] };
    expect(buildReport(later).totals.sales).toBe(2);
    expect(buildReport({ ...later, filters: { ...later.filters, mode: "cohort" } }).totals.sales).toBe(0);
  });

  it("mostra o dia local e troca o filtro para a primeira origem", () => {
    const result = buildReport({ ...input, filters: { ...input.filters, basis: "first", channel: "openai_ads" } });
    expect(result.totals.leads).toBe(1);
    expect(result.origins[0].channel).toBe("openai_ads");
    expect(result.costs).toEqual([]);
  });

  it("mantém no relatório de eventos a origem que existia na criação do lead", () => {
    const original = { ...row, kind: "lead_created", attribution: scope, attribution_basis: "observed" };
    const edited = { ...lead, marketing_attribution: { conversion: { channel: "meta_ads", campaign: "Outra" } } };
    const report = buildReport({ ...input, leads: [edited], events: [original], filters: { ...input.filters, channel: "google_ads" } });
    expect(report.totals.leads).toBe(1);
    expect(report.listedLeads.get(lead.id)?.origin.channel).toBe("google_ads");
  });

  it("protege células com caracteres de fórmula, inclusive após espaços", () => {
    expect(csv([["  =HYPERLINK(1)", "+5511", "Ásia; grupo", "A\"B", "linha\nnova"]]))
      .toBe("\uFEFF\"'  =HYPERLINK(1)\";\"'+5511\";\"Ásia; grupo\";\"A\"\"B\";\"linha\nnova\"\r\n");
  });
});
