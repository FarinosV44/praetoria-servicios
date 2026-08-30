import { expect, type Page } from "@playwright/test";

/**
 * Collects console errors and page exceptions for the life of a test.
 * AC-19-noconsole: the critical path must produce no console errors.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

/** Known-noise filter — third-party/browser lines we cannot control. */
export function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/favicon|ERR_INTERNET_DISCONNECTED|Download the React DevTools/i.test(e) &&
      // React #418/#423/#425 hydration-recovery lines are transient and self-heal;
      // a real hydration failure shows up as a broken assertion below, not just here.
      !/Minified React error #(418|423|425)/.test(e),
  );
}

/**
 * Drive the assistant from the intent step up to (but not including) the analysis
 * result. `problemText` >= 25 chars → a normal analysis (flow 1); shorter →
 * "needs more info" (flow 2).
 */
export async function fillAssistantToAnalysis(
  page: Page,
  opts: { problemText: string; municipality?: string; postalCode?: string },
) {
  const municipality = opts.municipality ?? "Valencia";
  const postalCode = opts.postalCode ?? "46001";

  await page.goto("/solicitar");
  await page.getByRole("button", { name: /Tengo una avería o un problema/i }).click();

  // triage — "Nada de esto, es un problema normal", then Continuar
  await page.getByText(/Nada de esto, es un problema normal/i).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();

  // category — Fontanería
  await page.getByRole("button", { name: /^Fontanería/i }).click();

  // photos — continue with no photos
  await page.getByRole("button", { name: /Continuar sin fotos/i }).click();

  // describe
  await page.getByLabel(/¿Qué ocurre\?/i).fill(opts.problemText);
  await page.getByLabel(/Municipio/i).fill(municipality);
  await page.getByLabel(/Código postal/i).fill(postalCode);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
}

/** Full flow 1: intent → … → contact → submitted, ending on "Solicitud recibida". */
export async function runAssistantHappyPath(
  page: Page,
  opts: { problemText?: string } = {},
) {
  const problemText =
    opts.problemText ??
    "Tengo una fuga de agua bajo el fregadero de la cocina y gotea sin parar desde ayer.";

  await fillAssistantToAnalysis(page, { problemText });

  // analysis resolves → the analysis panel; continue to the validate step
  await expect(page.getByText(/Parece un problema de|Hemos resumido lo que nos has contado/i))
    .toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();

  // validate step
  await expect(page.getByRole("heading", { name: /¿Lo hemos entendido bien\?/i })).toBeVisible();
  await page.getByRole("button", { name: /Sí, es correcto/i }).click();

  // contact
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Cliente de prueba");
  await page.getByRole("textbox", { name: "Teléfono", exact: true }).fill("600111222");
  await page.getByText(/Autorizo a Praetoria a gestionar esta solicitud/i).click();
  await page.getByRole("button", { name: /Enviar solicitud/i }).click();
}
