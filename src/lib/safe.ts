import { log } from "./logging";

/**
 * Run a query for a NON-CRITICAL page section. If it fails (a DB blip, a
 * provider timeout), log it and return the fallback instead of letting the
 * exception bubble up and turn the whole page into a 500.
 *
 * Only use this where the page is still worth showing without that data — the
 * marketing landing without its reviews block, a service page without its
 * ratings. Never use it to paper over a failure the caller must handle.
 */
export async function safe<T>(fn: () => Promise<T> | T, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    log.error(`safe(${label}) failed — using fallback`, {
      error: e instanceof Error ? e.message : String(e),
    });
    return fallback;
  }
}
