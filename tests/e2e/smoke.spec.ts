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

  test("the Carta de Confianza page is versioned and backs every commitment (#21)", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/confianza");
    await expect(page.getByRole("heading", { name: /Carta de Confianza Praetoria/i })).toBeVisible();
    await expect(page.getByText(/Versión 1\.0/i)).toBeVisible();
    await expect(page.getByText(/Cómo lo hacemos posible/i).first()).toBeVisible();
    await expect(page.getByText(/Qué presta Praetoria/i)).toBeVisible();
    await expect(page.getByText(/Qué ejecuta el profesional/i)).toBeVisible();
    // the "no external seal" honesty note
    await expect(page.getByText(/No es una certificación/i)).toBeVisible();
    expect(meaningfulErrors(errors)).toEqual([]);
  });

  test("a service page shows no reviews section when there are no real reviews (issue #26 AC-nodemo)", async ({
    page,
  }) => {
    await page.goto("/servicios/fontaneria");
    // no invented rating, no "sé el primero" empty state
    await expect(page.getByRole("heading", { name: /Opiniones verificadas/i })).toHaveCount(0);
    const html = await page.content();
    expect(html).not.toContain("aggregateRating");
  });

  test("a problem page has real, specific content and a tracked CTA (issue #25 / D10)", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/problemas");
    await expect(page.getByRole("heading", { level: 1, name: /Problemas del hogar/i })).toBeVisible();
    await page.getByRole("link", { name: /Fuga de agua en casa/i }).first().click();
    await expect(page).toHaveURL(/\/problemas\/fuga-de-agua$/);
    await expect(page.getByRole("heading", { name: /Causas más probables/i })).toBeVisible();
    await expect(page.getByText(/Cierra la llave de paso general/i)).toBeVisible();
    // bidirectional linking — related problems are reachable (AC-25-links)
    await expect(
      page.getByRole("link", { name: /Humedad o moho en una pared/i }),
    ).toBeVisible();
    expect(meaningfulErrors(errors)).toEqual([]);
  });

  test("zonas index loads and links are not orphaned (AC-25-orphan)", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    const siteNav = page.getByRole("navigation", { name: /Enlaces del sitio/i });
    // the footer indexes every SEO surface — nothing is orphaned
    await expect(siteNav.getByRole("link", { name: "Problemas" })).toHaveAttribute(
      "href",
      "/problemas",
    );
    await expect(siteNav.getByRole("link", { name: "Zonas" })).toHaveAttribute("href", "/zonas");
    await page.goto("/zonas");
    await expect(page.getByRole("heading", { level: 1, name: /Zonas donde trabajamos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Comprueba tu código postal/i })).toBeVisible();
    expect(meaningfulErrors(errors)).toEqual([]);
  });

  test("the professional recruitment form submits (issue #20)", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    // linked only from the footer — it must not compete with the client CTA
    await expect(
      page.getByRole("navigation", { name: /Enlaces del sitio/i }).getByRole("link", {
        name: "Trabaja con nosotros",
      }),
    ).toHaveAttribute("href", "/trabaja-con-nosotros");

    await page.goto("/trabaja-con-nosotros");
    await expect(page.getByRole("heading", { level: 1, name: /Trabaja con Praetoria/i })).toBeVisible();
    await expect(page.getByText(/No prometemos un volumen mínimo/i)).toBeVisible();

    await page.getByLabel("Nombre o empresa").fill("Taller E2E");
    await page.getByLabel("Fontanería", { exact: true }).check();
    await page.getByLabel("Teléfono").fill("612345678");
    await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.com`);
    await page.getByLabel(/Autorizo a Praetoria/i).check();
    await page.getByRole("button", { name: /Enviar candidatura/i }).click();

    await expect(page.getByText(/Hemos recibido tu candidatura/i)).toBeVisible();
    expect(meaningfulErrors(errors)).toEqual([]);
  });

  test("the guides index loads (issue #24 CMS)", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/guias");
    await expect(page.getByRole("heading", { name: /Guías y consejos/i })).toBeVisible();
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
    expect(xml).toContain("/problemas/fuga-de-agua");
    expect(await robots.text()).toContain("/problemas");

    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();
    expect((await manifest.json()).theme_color).toBe("#b0522f");

    // JSON-LD present on the landing
    const home = await request.get("/");
    expect(await home.text()).toContain('"@type":"FAQPage"');
  });
});
