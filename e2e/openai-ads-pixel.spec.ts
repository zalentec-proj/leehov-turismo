import { expect, test, type Page } from "@playwright/test";

const endpoint = "https://bzr.openai.com/v1/sdk/events";
const whatsapp = "https://wa.me/5545999078380";
const consentKey = "leehov-openai-ads-consent-v1-1";
const opprefKey = "leehov-openai-oppref";
const referral = "gAAAAAb123_opaque-click-reference";

async function captureOpenAI(page: Page, serverStatus = 204) {
  const events: URLSearchParams[] = [];
  const sdkRequests: string[] = [];
  const serverEvents: { type: string; id: string; path: string; oppref?: string }[] = [];
  await page.route("**/api/medicao", (route) => {
    const body = route.request().postDataJSON();
    if (body.type === "openai_whatsapp") {
      serverEvents.push(body);
      return route.fulfill({ status: serverStatus });
    }
    return route.fulfill({ status: 204 });
  });
  await page.route("https://bzrcdn.openai.com/**", (route) => {
    sdkRequests.push(route.request().url());
    return route.abort();
  });
  await page.route(`${endpoint}**`, (route) => {
    events.push(new URL(route.request().url()).searchParams);
    return route.fulfill({ contentType: "image/gif", body: Buffer.from("R0lGODlhAQABAAAAACwAAAAAAQABAAA=", "base64") });
  });
  await page.context().route("https://wa.me/**", (route) => route.fulfill({ body: "WhatsApp test" }));
  return { events, sdkRequests, serverEvents };
}

function whatsappLink(page: Page) {
  return page.getByRole("link", { name: "Falar com a Leehov pelo WhatsApp" });
}

async function clickWhatsApp(page: Page) {
  const [popup] = await Promise.all([page.waitForEvent("popup"), whatsappLink(page).click()]);
  await expect(popup).toHaveURL((url) => url.origin + url.pathname === whatsapp);
  await popup.close();
}

test("reusa o identificador do clique real entre servidor e Pixel, preservando oppref e destino", async ({ page }) => {
  const { events, sdkRequests, serverEvents } = await captureOpenAI(page);
  await page.goto(`/contato?utm_source=chatgpt&oppref=${referral}`);
  await page.getByRole("link", { name: "Quem Somos", exact: true }).first().click();
  await expect(page).toHaveURL(/\/quem-somos$/);
  await page.getByRole("button", { name: "Aceitar analíticos" }).click();
  await expect(page.getByRole("button", { name: "Rever cookies" })).toBeVisible();
  expect(events).toHaveLength(0);
  await page.goto("/contato");
  await page.getByLabel("E-mail", { exact: true }).first().fill("teste@example.invalid");
  await whatsappLink(page).dispatchEvent("click");
  await clickWhatsApp(page);
  await expect.poll(() => events.length).toBe(1);
  expect(sdkRequests).toEqual([]);
  expect(serverEvents).toHaveLength(1);
  expect(serverEvents[0]).toEqual({
    id: events[0].get("event_id"),
    type: "openai_whatsapp",
    path: "/contato",
    oppref: referral,
  });
  expect(Object.fromEntries(events[0])).toEqual({
    pid: "AAy1gfaoDcQhWDighRrZqq",
    event: "custom",
    custom_event_name: "whatsapp_click",
    event_id: expect.stringMatching(/^[\da-f-]{36}$/),
    "data[type]": "custom",
    oppref: referral,
  });
  await clickWhatsApp(page);
  await expect.poll(() => events.length).toBe(2);
  expect(serverEvents).toHaveLength(2);
  expect(serverEvents[1].id).toBe(events[1].get("event_id"));
  expect(events[1].get("event_id")).not.toBe(events[0].get("event_id"));
});

test("o Pixel continua entregando quando o servidor falha", async ({ page }) => {
  const { events, serverEvents } = await captureOpenAI(page, 502);
  await page.goto("/contato");
  await page.getByRole("button", { name: "Aceitar analíticos" }).click();
  await clickWhatsApp(page);
  await expect.poll(() => events.length).toBe(1);
  expect(serverEvents).toHaveLength(1);
  expect(events[0].get("event_id")).toBe(serverEvents[0].id);
  expect(events[0].has("oppref")).toBe(false);
});

test("aceite legado, somente essenciais e revogação não enviam cliques", async ({ page }) => {
  const { events, sdkRequests, serverEvents } = await captureOpenAI(page);
  await page.addInitScript(() => localStorage.setItem("leehov-cookie-consent-v1", "analytics"));
  await page.goto(`/contato?oppref=${referral}`);
  const review = page.getByRole("button", { name: "Rever cookies" });
  await expect(review).toBeVisible();
  await clickWhatsApp(page);
  expect(events).toHaveLength(0);
  expect(serverEvents).toHaveLength(0);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), opprefKey)).toBeNull();
  await review.click();
  await page.getByRole("button", { name: "Somente essenciais" }).click();
  await clickWhatsApp(page);
  expect(events).toHaveLength(0);
  expect(serverEvents).toHaveLength(0);
  await review.click();
  await expect(page.getByRole("dialog")).toContainText("OpenAI");
  await page.getByRole("button", { name: "Aceitar analíticos" }).click();
  await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), opprefKey)).toBe(referral);
  await page.getByRole("link", { name: "Quem Somos", exact: true }).first().click();
  await expect(page).toHaveURL(/\/quem-somos$/);
  await review.click();
  await page.getByRole("button", { name: "Somente essenciais" }).click();
  await clickWhatsApp(page);
  expect(events).toHaveLength(0);
  expect(serverEvents).toHaveLength(0);
  expect(sdkRequests).toHaveLength(0);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), opprefKey)).toBeNull();
  await review.click();
  await page.getByRole("button", { name: "Aceitar analíticos" }).click();
  await clickWhatsApp(page);
  await expect.poll(() => events.length).toBe(1);
  expect(events[0].has("oppref")).toBe(false);
});

test("expiração bloqueia o clique e limpa a referência na aba aberta", async ({ page }) => {
  await page.clock.install();
  const { events } = await captureOpenAI(page);
  await page.addInitScript((key) => {
    localStorage.setItem("leehov-cookie-consent-v1", "analytics");
    localStorage.setItem(key, String(Date.now() + 60_000));
  }, consentKey);
  await page.goto(`/contato?oppref=${referral}`);
  await clickWhatsApp(page);
  await expect.poll(() => events.length).toBe(1);
  await page.clock.fastForward(60_001);
  await clickWhatsApp(page);
  expect(events).toHaveLength(1);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), opprefKey)).toBeNull();
});

test("não encaminha um telefone como referência de anúncio", async ({ page }) => {
  const { events } = await captureOpenAI(page);
  await page.goto("/contato?oppref=%2B5511000000000");
  await page.getByRole("button", { name: "Aceitar analíticos" }).click();
  await clickWhatsApp(page);
  await expect.poll(() => events.length).toBe(1);
  expect(events[0].has("oppref")).toBe(false);
});

test("revalida consentimento gravado no instante do clique", async ({ page }) => {
  const { events } = await captureOpenAI(page);
  await page.goto("/contato");
  await page.getByRole("button", { name: "Aceitar analíticos" }).click();
  await page.evaluate((key) => window.addEventListener("click", () => localStorage.removeItem(key), {
    capture: true, once: true,
  }), consentKey);
  await clickWhatsApp(page);
  expect(events).toHaveLength(0);
});
