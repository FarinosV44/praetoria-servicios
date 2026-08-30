import { test, expect } from "@playwright/test";

/**
 * Issue #19 — "Tests de autorización y enlaces caducados."
 * The happy paths for quotes/acceptance are integration-tested (TP-7, TP-10);
 * here we assert the deny paths in a real browser.
 */

test("admin routes require a session — redirect to login", async ({ page }) => {
  await page.goto("/admin/solicitudes");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: /Entrar|Acceso|Admin/i })).toBeVisible();
});

test("a tampered signed link is refused (no sequential/guessable access, D-009)", async ({
  page,
}) => {
  await page.goto("/s/not-a-real-token-000000000000");
  await expect(page.getByText(/no hemos podido abrir|no es válido|caducado/i)).toBeVisible();
});

test("the admin login rejects wrong credentials", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel(/correo|email/i).fill("admin@praetoria.local");
  await page.getByLabel(/contraseña|password/i).fill("wrong-password");
  await page.getByRole("button", { name: /Entrar/i }).click();
  await expect(page.getByText(/no.*correct|incorrect|credenciales/i)).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("the seeded admin can sign in and see the request list", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel(/correo|email/i).fill("admin@praetoria.local");
  await page.getByLabel(/contraseña|password/i).fill("praetoria-dev");
  await page.getByRole("button", { name: /Entrar/i }).click();
  await expect(page).toHaveURL(/\/admin(\/solicitudes)?$/);
  await expect(page.getByRole("heading", { name: /Solicitudes|Panel/i })).toBeVisible();
});
