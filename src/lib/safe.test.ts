import { describe, expect, it, vi } from "vitest";
import { safe } from "./safe";

/**
 * A non-critical page section (e.g. the landing "reviews" block) must never take
 * the whole page down when its query fails — a DB blip should degrade to the
 * fallback, not a 500. Reproduction for the "internal server error when the DB
 * is unreachable" report.
 */

describe("safe", () => {
  it("returns the value when the query succeeds", async () => {
    expect(await safe(() => Promise.resolve([1, 2, 3]), [], "x")).toEqual([1, 2, 3]);
  });

  it("returns the fallback (and does not throw) when the query rejects", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await safe(
      () => Promise.reject(new Error("Can't reach database server")),
      [] as number[],
      "reviews",
    );
    expect(out).toEqual([]);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("returns the fallback when the query throws synchronously", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await safe(
      () => {
        throw new Error("boom");
      },
      "fallback",
      "y",
    );
    expect(out).toBe("fallback");
    vi.restoreAllMocks();
  });
});
