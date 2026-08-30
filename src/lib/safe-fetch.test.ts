import { describe, expect, it } from "vitest";
import { assertSafeUrl, isBlockedAddress, SsrfBlockedError } from "./safe-fetch";

describe("isBlockedAddress", () => {
  it("blocks loopback, private and link-local IPv4", () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "172.16.3.4", "192.168.1.1", "169.254.1.1", "0.0.0.0"]) {
      expect(isBlockedAddress(ip)).toBe(true);
    }
  });
  it("blocks CGNAT and test-nets", () => {
    expect(isBlockedAddress("100.64.0.1")).toBe(true);
    expect(isBlockedAddress("198.51.100.7")).toBe(true);
    expect(isBlockedAddress("203.0.113.7")).toBe(true);
  });
  it("allows a normal public IPv4", () => {
    expect(isBlockedAddress("93.184.216.34")).toBe(false);
    expect(isBlockedAddress("8.8.8.8")).toBe(false);
  });
  it("blocks loopback/ULA/link-local IPv6 and IPv4-mapped private", () => {
    for (const ip of ["::1", "fe80::1", "fd00::1", "::ffff:127.0.0.1"]) {
      expect(isBlockedAddress(ip)).toBe(true);
    }
  });
  it("blocks anything that is not a valid IP literal", () => {
    expect(isBlockedAddress("not-an-ip")).toBe(true);
    expect(isBlockedAddress("999.1.1.1")).toBe(true);
  });
});

describe("assertSafeUrl", () => {
  it("rejects non-http(s) schemes", async () => {
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl("gopher://x")).rejects.toBeInstanceOf(SsrfBlockedError);
  });
  it("rejects credentials in the URL", async () => {
    await expect(assertSafeUrl("http://user:pass@example.com/")).rejects.toBeInstanceOf(
      SsrfBlockedError,
    );
  });
  it("rejects localhost and *.internal by name", async () => {
    await expect(assertSafeUrl("http://localhost:3000/")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl("https://db.internal/")).rejects.toBeInstanceOf(SsrfBlockedError);
  });
  it("rejects a literal private IP host", async () => {
    await expect(assertSafeUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow(
      /169\.254/,
    );
  });
  it("accepts a public IP host without a DNS lookup", async () => {
    const u = await assertSafeUrl("https://93.184.216.34/policy.pdf");
    expect(u.hostname).toBe("93.184.216.34");
  });
});
