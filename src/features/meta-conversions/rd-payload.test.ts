import { describe, expect, it } from "vitest";
import { normalizeBrazilPhone, parseRdDealWebhook } from "@/features/meta-conversions/rd-payload";

describe("webhook do RD para conversões Meta", () => {
  it("lê a negociação sem preservar o payload inteiro", () => {
    expect(parseRdDealWebhook({ transaction_uuid: "tx-1", document: { id: "deal-1", status: "won", source_id: "source-1", campaign_id: "campaign-1", campaign_name: "China e Singapura", contacts: [{ id: "contact-1" }], closed_at: "2026-09-02T12:00:00Z", value: "R$ 32.000,50" } })).toMatchObject({ dealId: "deal-1", transactionId: "tx-1", status: "won", sourceId: "source-1", campaignId: "campaign-1", contactIds: ["contact-1"], value: 32000.5 });
  });

  it("lê o campo amount_total documentado pelo webhook do RD", () => {
    expect(parseRdDealWebhook({ event_name: "crm_deal_updated", document: { id: "deal-2", status: "won", amount_total: 5400 } })).toMatchObject({ dealId: "deal-2", eventName: "crm_deal_updated", value: 5400 });
  });

  it("lê total_price retornado pela API CRM v2 da negociação", () => {
    expect(parseRdDealWebhook({ id: "deal-2-api", total_price: 5400 })).toMatchObject({ dealId: "deal-2-api", value: 5400 });
  });

  it("preserva contact_ids quando a relação contacts vem vazia no CRM v2", () => {
    expect(parseRdDealWebhook({ event_name: "crm_deal_updated", document: { id: "deal-3", contacts: [], contact_ids: ["contact-3"] } })).toMatchObject({ dealId: "deal-3", contactIds: ["contact-3"] });
  });

  it("normaliza telefone BR para o formato internacional", () => {
    expect(normalizeBrazilPhone("(11) 99876-5432")).toBe("+5511998765432");
  });
});
