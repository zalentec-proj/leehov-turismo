import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { consentCookies, consumeRateLimit } = vi.hoisted(() => ({
  consentCookies: new Map<string, string>(),
  consumeRateLimit: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ value: consentCookies.get(name) }) }),
}));
vi.mock("@/features/settings/queries", () => ({
  getPublicSiteSettings: async () => ({ consent: { enabled: true, version: 1 } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: consumeRateLimit }),
}));

const site = "https://leehovturismo.com.br";
const click = {
  type: "openai_whatsapp",
  id: randomUUID(),
  path: "/contato",
  oppref: "gAAAAAb123_opaque-click-reference",
};
const sender = vi.fn<typeof fetch>();

function post(payload: unknown = click, origin = site) {
  return POST(new Request(`${site}/api/medicao`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(payload),
  }));
}

describe("WhatsApp pela API de Conversões da OpenAI", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", site);
    vi.stubEnv("FORM_SECURITY_SECRET", "somente-para-testes-locais-da-medicao");
    vi.stubEnv("OPENAI_CONVERSIONS_API_KEY", "chave-ficticia-de-teste");
    vi.stubGlobal("fetch", sender);
    sender.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
    consumeRateLimit.mockReset().mockResolvedValue({ data: true, error: null });
    consentCookies.set("leehov_cookie_consent", "analytics");
    consentCookies.set("leehov_site_measurement", `1.${Date.now() + 60_000}`);
  });

  afterEach(() => {
    consentCookies.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("envia o mesmo ID do clique para o Pixel existente, sem dados de atendimento", async () => {
    const start = Date.now();
    expect((await post()).status).toBe(204);
    expect(sender).toHaveBeenCalledTimes(1);

    const [url, request] = sender.mock.calls[0];
    expect(String(url)).toBe("https://bzr.openai.com/v1/events?pid=AAy1gfaoDcQhWDighRrZqq");
    expect(new Headers(request?.headers).get("authorization")).toBe("Bearer chave-ficticia-de-teste");
    const body = JSON.parse(String(request?.body));
    expect(body).toEqual({ events: [{
      id: click.id,
      type: "custom",
      custom_event_name: "whatsapp_click",
      timestamp_ms: expect.any(Number),
      action_source: "web",
      source_url: `${site}/contato`,
      oppref: click.oppref,
      opt_out: true,
      data: { type: "custom" },
    }] });
    expect(body.events[0].timestamp_ms).toBeGreaterThanOrEqual(start);
    expect(body.events[0].timestamp_ms).toBeLessThanOrEqual(Date.now());
  });

  it("bloqueia visitantes sem aceite e pedidos de outra origem", async () => {
    expect((await post(click, "https://example.invalid")).status).toBe(403);
    consentCookies.set("leehov_cookie_consent", "essential");
    expect((await post()).status).toBe(204);
    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(sender).not.toHaveBeenCalled();
  });

  it("recusa referências inválidas e URLs com query", async () => {
    expect((await post({ ...click, oppref: "+5511000000000" })).status).toBe(400);
    expect((await post({ ...click, path: "/contato?email=teste@example.invalid" })).status).toBe(400);
    expect(sender).not.toHaveBeenCalled();
  });

  it("aplica o limite antes do envio à OpenAI", async () => {
    consumeRateLimit.mockResolvedValue({ data: false, error: null });
    expect((await post()).status).toBe(429);
    expect(sender).not.toHaveBeenCalled();
  });
});
