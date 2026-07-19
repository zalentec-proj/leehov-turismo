import { expect, test } from "@playwright/test";

test("Home e navegação pública carregam sem overflow horizontal", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Leehov/i);
  await expect(page.getByRole("link", { name: /Leehov Turismo/i }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("Blog não expõe rascunhos", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: /Histórias e orientações/i })).toBeVisible();
  await page.goto("/blog/descobrindo-a-tailandia");
  await expect(page.getByText("Erro 404")).toBeVisible();
});

test("menu mobile abre, indica a rota e fecha", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Fluxo específico do viewport mobile");
  await page.goto("/blog");
  await page.getByRole("button", { name: "Abrir menu principal" }).click();
  const blogLink = page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Blog" });
  await expect(blogLink).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Fechar menu" }).click();
  await expect(page.getByRole("navigation", { name: "Menu principal" })).toBeHidden();
});

test("Blog permanece responsivo nos quatro breakpoints de aceite", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("desktop"), "A matriz completa roda uma vez no Chrome desktop");
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: /Histórias e orientações/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `overflow horizontal em ${width}px`).toBe(false);
  }
});

test("detalhe da caravana permite navegar pelo roteiro", async ({ page }) => {
  await page.goto("/caravanas/dev-caravana-japao");
  await expect(page.getByRole("heading", { name: /Japão em grupo/i })).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText("1 de 3");
  await page.getByRole("button", { name: "Próximo dia" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("2 de 3");
});
