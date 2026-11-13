import { describe, expect, it } from "vitest";
import { classifyTouch, cleanTouch, getAttribution, publicPath, signalsFromUrl } from "./attribution";

describe("origem de campanha da Leehov", () => {
  it.each([
    ["?gclid=valid-abc1234567890", "", "google_ads"],
    ["?utm_source=ig&utm_medium=paid_social&utm_campaign=asia", "", "meta_ads"],
    ["?utm_source=chatgpt&utm_medium=paid&utm_id=1234", "", "openai_ads"],
    ["?oppref=valid_abc123456789012345", "", "openai_ads"],
    ["?fbclid=valid-abc1234567890", "https://www.facebook.com/x", "organic_social"],
    ["?fbclid=valid-abc1234567890", "", "unknown"],
    ["", "https://chatgpt.com/c/private", "ai_referral"],
    ["", "https://www.google.com.br/search?q=x", "organic_search"],
    ["?utm_source=facebook&utm_medium=paid&gclid=valid-abc1234567890", "", "unknown"],
  ])("classifies %s and %s as %s", (query, referrer, expected) => {
    const signals = signalsFromUrl(new URLSearchParams(query), referrer, "leehovturismo.com.br", "/caravanas/asia");
    expect(classifyTouch(signals).channel).toBe(expected);
  });

  it("retém só caminho público, domínio e identificadores permitidos", () => {
    const value = signalsFromUrl(new URLSearchParams("utm_campaign=pessoa%40exemplo.com&utm_term=11912345678&utm_id=1234567890&gclid=valid-abc1234567890"), "https://www.google.com.br/search?q=segredo", "leehovturismo.com.br", "/caravanas/asia");
    expect(value).toEqual({ google: true, campaignId: "1234567890", referrerDomain: "www.google.com.br", landingPath: "/caravanas/asia" });
    expect(publicPath("/admin/leads/123")).toBeUndefined();
    expect(publicPath("/contato?secret=1")).toBeUndefined();
    expect(cleanTouch({ referrerDomain: "https://example.org/?secret=1", campaign: "cpf=123", secret: "123" })).toEqual({});
  });

  it("separa a sessão direta da última origem e da primeira conhecida", () => {
    const now = new Date("2026-11-13T12:00:00Z").getTime();
    const context = { first: { google: true, at: now - 10_000 }, last: { openai: true, at: now - 1_000 }, session: { landingPath: "/contato", at: now } } as const;
    expect(getAttribution(context, now)).toMatchObject({
      first: { channel: "google_ads" }, session: { channel: "direct" }, conversion: { channel: "openai_ads" },
    });
    expect(getAttribution(context, now + 31 * 86400_000).conversion.channel).toBe("unknown");
  });
});
