import { test, expect } from "@playwright/test";
import {
  collectConsoleErrors,
  meaningfulErrors,
  fillAssistantToAnalysis,
  runAssistantHappyPath,
} from "./_helpers";

/**
 * Issue #19 flow 1 (solicitud correcta) — asserted on both projects, so the
 * mobile project (Pixel 5) covers AC-19-mobile.
 */
test("flow 1: a complete request ends with a reference and no console errors", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await runAssistantHappyPath(page);

  await expect(page.getByRole("heading", { name: /Solicitud recibida/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Tu referencia es/i)).toBeVisible();
  expect(meaningfulErrors(errors)).toEqual([]);
});

/**
 * Issue #19 flow 2 (la IA pide aclaración) — a short description trips the mock's
 * "needs more info" branch.
 */
test("flow 2: a sparse description asks for more information", async ({ page }) => {
  await fillAssistantToAnalysis(page, { problemText: "gotea un poco" });

  await expect(
    page.getByText(/Necesitamos un poco más de información para entender/i),
  ).toBeVisible({ timeout: 20_000 });
});
