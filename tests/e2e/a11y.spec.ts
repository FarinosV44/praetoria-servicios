import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Issue #19 — "Auditoría automática de accesibilidad."
 * WCAG 2.2 AA floor. This is the automated half; the guided assistive-technology
 * pass (screen reader, keyboard) is run separately with the user
 * (Keel `references/accessibility.md`) and recorded in docs/05-test-points.md.
 */

const PAGES = [
  "/",
  "/solicitar",
  "/servicios/fontaneria",
  "/servicios",
  "/problemas",
  "/problemas/fuga-de-agua",
  "/zonas",
  "/cobertura",
  "/confianza",
  "/trabaja-con-nosotros",
];

for (const path of PAGES) {
  test(`axe: no serious/critical violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    if (blocking.length) {
      console.log(
        `axe violations on ${path}:\n` +
          blocking.map((v) => `  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length})`).join("\n"),
      );
    }
    expect(blocking).toEqual([]);
  });
}
