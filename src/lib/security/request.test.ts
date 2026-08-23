import { describe, expect, it } from "vitest";
import { hasSameOrigin, isSafeAdminJsonRequest, parseSafeAdminJson, secretsMatch } from "@/lib/security/request";

describe("proteção de requisições administrativas", () => {
  it("aceita JSON de mesma origem dentro do limite", () => {
    const request = new Request("https://leehovturismo.com.br/api/webhooks/test", {
      method: "POST",
      headers: {
        origin: "https://leehovturismo.com.br",
        "content-type": "application/json; charset=utf-8",
        "content-length": "42",
      },
    });
    expect(hasSameOrigin(request)).toBe(true);
    expect(isSafeAdminJsonRequest(request)).toBe(true);
  });

  it("recusa origem externa e payload administrativo grande", () => {
    const external = new Request("https://leehovturismo.com.br/api/webhooks/test", {
      method: "POST",
      headers: { origin: "https://site-malicioso.example", "content-type": "application/json", "content-length": "42" },
    });
    const oversized = new Request("https://leehovturismo.com.br/api/webhooks/test", {
      method: "POST",
      headers: { origin: "https://leehovturismo.com.br", "content-type": "application/json", "content-length": "999999" },
    });
    expect(isSafeAdminJsonRequest(external)).toBe(false);
    expect(isSafeAdminJsonRequest(oversized)).toBe(false);
  });

  it("compara segredos sem aceitar prefixos", () => {
    expect(secretsMatch("segredo", "segredo")).toBe(true);
    expect(secretsMatch("segredo", "segredo-extra")).toBe(false);
    expect(secretsMatch("", "segredo")).toBe(false);
  });

  it("impõe o limite real mesmo quando content-length não é informado", async () => {
    const request = new Request("https://leehovturismo.com.br/api/webhooks/test", {
      method: "POST",
      headers: {
        origin: "https://leehovturismo.com.br",
        "content-type": "application/json",
      },
      body: JSON.stringify({ value: "x".repeat(70 * 1024) }),
    });

    await expect(parseSafeAdminJson(request)).resolves.toBeNull();
  });
});
