import { expect, it, vi } from "vitest";

it("mantém UTMs de entrada durante navegação e não mistura duas campanhas", async () => {
  vi.resetModules();
  const { collectAttribution } = await import("./attribution");
  window.history.replaceState(null, "", "/?utm_source=chatgpt&utm_campaign=china");
  expect(collectAttribution().utmSource).toBe("chatgpt");
  window.history.replaceState(null, "", "/contato");
  expect(collectAttribution()).toMatchObject({ pagePath: "/contato", utmSource: "chatgpt", utmCampaign: "china" });
  window.history.replaceState(null, "", "/?utm_source=google");
  expect(collectAttribution()).toMatchObject({ utmSource: "google", utmCampaign: "" });
  window.history.replaceState(null, "", "/");
});
