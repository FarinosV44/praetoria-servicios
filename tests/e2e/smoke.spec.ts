import { test, expect } from "@playwright/test";
import { collectConsoleErrors, meaningfulErrors } from "./_helpers";

test.describe("public pages — smoke + no console errors (AC-19-noconsole)", () => {
  test("landing renders and hydrates cleanly", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Solucionar un problema/i }).first()).toBeVisible();
    expect(meaningfulErrors(errors)).toEqual([]);
  });

  test("a service page has real, specific content (D10)", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/servicios/fontaneria");
    await expect(page.getByRole("heading", { name: /Fontanería en Valencia/i })).toBeVisible();
    await expect(page.getByText(/Qué cubre este servicio/i)).toBeVisible();
    await expect(page.getByText(/Qué incluye el presupuesto/i)).toBeVisible();
    expect(meaningfulErrors(errors)).toEqual([]);
  });

  test("coverage checker: a Valencia-area postcode is within the area (D-013)", async ({ page }) => {
    await page.goto("/cobertura");
    await page.getByLabel(/Código postal/i).fill("46900");
    await page.getByRole("button", { name: /Comprobar/i }).click();
    await expect(page.getByText(/damos servicio en toda el área de Valencia/i)).toBeVisible();
  });

  test("SEO endpoints", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    expect(xml).toContain("/servicios/fontaneria");
    expect(xml).toContain("/cobertura");

    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();
    expect((await manifest.json()).theme_color).toBe("#b0522f");

    // JSON-LD present on the landing
    const home = await request.get("/");
    expect(await home.text()).toContain('"@type":"FAQPage"');
  });
});
