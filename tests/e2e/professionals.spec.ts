import { test, expect } from "@playwright/test";
import { collectConsoleErrors, meaningfulErrors } from "./_helpers";

/**
 * Issue #22 — the manual professional-network admin flow works end to end.
 * (The assignment-compatibility rules are covered by unit + integration tests;
 * here we prove the UI drives the service.)
 */

// The admin panel is a data-dense desktop tool — not built for a phone viewport.
test.skip(({ isMobile }) => isMobile, "admin panel is desktop-only");

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/correo|email/i).fill("admin@praetoria.local");
  await page.getByLabel(/contraseña|password/i).fill("praetoria-dev");
  await page.getByRole("button", { name: /Entrar/i }).click();
  await expect(page).toHaveURL(/\/admin(\/solicitudes)?$/);
}

test("create → approve a professional, with the regulated-trade guardrail visible", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page);
  await login(page);

  await page.goto("/admin/profesionales");
  await expect(page.getByRole("heading", { name: /Red de profesionales/i })).toBeVisible();

  await page.getByLabel(/Nombre legal/i).fill("Electro Verifica SL");
  await page.getByLabel(/Nombre visible para el cliente/i).fill("Electro Verifica");
  await page.getByRole("checkbox", { name: /^Electricidad/ }).check();
  await page.getByRole("checkbox", { name: "Valencia", exact: true }).check();
  await page.getByRole("button", { name: /Crear como CANDIDATO/i }).click();

  // redirected to the detail page
  await expect(page).toHaveURL(/\/admin\/profesionales\/[a-z0-9]+$/i);
  await expect(page.getByText(/CANDIDATO/).first()).toBeVisible();
  await expect(page.getByText(/Oficios regulados/i)).toBeVisible();
  await expect(page.getByText(/sin acreditación vigente/i)).toBeVisible();

  // walk the lifecycle to APROBADO
  for (const to of ["DOCUMENTACION_PENDIENTE", "VERIFICANDO", "APROBADO"]) {
    await page.locator("select").first().selectOption(to);
    await page.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(page.getByText(new RegExp(to)).first()).toBeVisible();
  }

  // record a real (non-contact) verification
  await page.locator("select").nth(1).selectOption("IDENTITY");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verificaciones (1)" })).toBeVisible();

  expect(meaningfulErrors(errors)).toEqual([]);
});
