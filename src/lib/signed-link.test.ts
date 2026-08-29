import { describe, expect, it } from "vitest";

// Ensure a deterministic secret before the module reads env.
process.env.SIGNED_LINK_SECRET = "test-secret-value-1234567890";

const { issueClientLink, parseClientLink, hashToken } = await import("./signed-link");

describe("signed client links", () => {
  it("round-trips a valid link", () => {
    const issued = issueClientLink("req_abc123", 24);
    const parsed = parseClientLink(issued.token);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.requestId).toBe("req_abc123");
      expect(parsed.tokenHash).toBe(issued.tokenHash);
      expect(parsed.tokenHash).toBe(hashToken(issued.token));
    }
  });

  it("stored hash is not the token", () => {
    const issued = issueClientLink("req_x", 1);
    expect(issued.tokenHash).not.toContain(issued.token);
    expect(issued.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects a tampered payload", () => {
    const issued = issueClientLink("req_abc123", 24);
    const [payload, sig] = issued.token.split(".");
    const tampered = `${Buffer.from("req_evil.9999999999999.x").toString("base64url")}.${sig}`;
    const parsed = parseClientLink(tampered);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason).toBe("bad_signature");
    expect(payload).toBeDefined();
  });

  it("rejects an expired link", () => {
    const issued = issueClientLink("req_abc123", -1); // already expired
    const parsed = parseClientLink(issued.token);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason).toBe("expired");
  });

  it("rejects a malformed token", () => {
    expect(parseClientLink("not-a-token").ok).toBe(false);
    expect(parseClientLink("a.b.c").ok).toBe(false);
  });
});
