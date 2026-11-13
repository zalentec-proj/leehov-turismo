import { expect, test } from "@playwright/test";

const code = /^LH-[A-Z0-9]{14}$/;
type RequestBody = { id: string; type: string; path: string; reference?: string; context: { visitorId: string; sessionId: string; first?: { google?: true }; session: { landingPath: string; google?: true }; last?: { google?: true } } };

test("Google Ads permanece como primeira origem e a referência não depende da rede", async ({ page }) => {
  const captured: RequestBody[] = [];
  await page.route("**/api/medicao", async (route) => {
    const payload = route.request().postDataJSON() as RequestBody;
    captured.push(payload);
    const firstAttempt = payload.type === "whatsapp" && captured.filter((event) => event.id === payload.id).length === 1;
    await route.fulfill({ status: firstAttempt ? 503 : 204 });
  });
  await page.route("https://bzr.openai.com/**", (route) => route.abort());
  await page.context().route("https://wa.me/**", (route) => route.fulfill({ body: "WhatsApp de teste" }));
  await page.goto("/contato?utm_source=google&utm_medium=cpc&utm_campaign=asia&gclid=test-abc123456789");
  await expect(page.getByRole("button", { name: "Aceitar analíticos" })).toBeVisible();
  expect(captured).toHaveLength(0);
  await page.getByRole("button", { name: "Aceitar analíticos" }).click();
  await expect.poll(() => captured.filter((item) => item.type === "page").length).toBe(1);
  const first = captured[0].context;
  expect(first.session).toMatchObject({ google: true, landingPath: "/contato" });
  // A new direct document keeps the visitor and starts its own session.
  await page.goto("/quem-somos");
  await expect.poll(() => captured.filter((item) => item.type === "page").length).toBe(2);
  const direct = captured[1].context;
  expect(direct.visitorId).toBe(first.visitorId);
  expect(direct.sessionId).not.toBe(first.sessionId);
  expect(direct.first?.google).toBe(true);
  expect(direct.last?.google).toBe(true);
  expect(direct.session.google).toBeUndefined();

  const cta = page.getByRole("link", { name: "Falar com a Leehov pelo WhatsApp" });
  const [popup] = await Promise.all([page.waitForEvent("popup"), cta.click()]);
  await expect(popup).toHaveURL(/wa\.me\/\d+\?text=/);
  const destination = new URL(popup.url());
  await popup.close();
  await expect.poll(() => captured.filter((item) => item.type === "whatsapp").length).toBe(2);
  const [click, retry] = captured.filter((item) => item.type === "whatsapp");
  expect(click.reference).toMatch(code);
  expect(retry).toEqual(click);
  expect(destination.searchParams.get("text")).toContain(click.reference);

  await page.getByRole("button", { name: "Rever cookies" }).click();
  await page.getByRole("button", { name: "Somente essenciais" }).click();
  const [essentialPopup] = await Promise.all([page.waitForEvent("popup"), cta.click()]);
  await expect(essentialPopup).toHaveURL((url) => !url.searchParams.get("text")?.includes("LH-") && url.hostname === "wa.me");
  await essentialPopup.close();
  expect(captured.filter((item) => item.type === "whatsapp")).toHaveLength(2);
});

test("o navegador pode excluir seus dados após revogar o aceite", async ({ page }) => {
  await page.route("https://bzr.openai.com/**", (route) => route.abort());
  await page.goto("/politica-de-privacidade?utm_source=chatgpt&utm_medium=paid");
  const first = page.waitForResponse((response) => response.url().endsWith("/api/medicao") && response.request().postDataJSON().type === "page");
  await page.getByRole("button", { name: "Aceitar analíticos" }).click();
  expect((await first).status()).toBe(204);
  await page.getByRole("button", { name: "Rever cookies" }).click();
  await page.getByRole("button", { name: "Somente essenciais" }).click();
  const erase = page.waitForResponse((response) => response.url().endsWith("/api/medicao") && response.request().postDataJSON().type === "erase");
  await page.getByRole("button", { name: "Apagar dados de medição deste navegador" }).click();
  expect((await erase).status()).toBe(204);
  await expect(page.getByRole("status")).toContainText("Dados de medição deste navegador excluídos.");
});

test("o endpoint de exportação bloqueia acesso anônimo", async ({ request }) => {
  const response = await request.get("/api/admin/conversoes/exportar");
  expect(response.status()).toBe(403);
  expect(response.headers()["content-type"]).not.toContain("csv");
});
