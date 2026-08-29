import { describe, expect, it } from "vitest";
import { detectImageType, validatePhoto } from "./validation";
import { LIMITS } from "@/config/limits";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const heic = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
const elf = new Uint8Array([0x7f, 0x45, 0x4c, 0x46]); // executable
const script = new Uint8Array([...Buffer.from("#!/bin/sh\necho hi")]);

describe("detectImageType", () => {
  it("recognises real image signatures", () => {
    expect(detectImageType(jpeg)).toBe("image/jpeg");
    expect(detectImageType(png)).toBe("image/png");
    expect(detectImageType(webp)).toBe("image/webp");
    expect(detectImageType(heic)).toBe("image/heic");
  });

  it("rejects an executable disguised as an image", () => {
    expect(detectImageType(elf)).toBeNull();
    expect(detectImageType(script)).toBeNull();
  });
});

describe("validatePhoto", () => {
  it("accepts a valid jpeg", () => {
    const r = validatePhoto({ bytes: jpeg, declaredType: "image/jpeg", size: jpeg.length }, 0);
    expect(r.ok).toBe(true);
  });

  it("rejects a .jpg that is really an ELF binary", () => {
    const r = validatePhoto({ bytes: elf, declaredType: "image/jpeg", size: elf.length }, 0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("not_an_image");
  });

  it("rejects when the count limit is reached", () => {
    const r = validatePhoto(
      { bytes: jpeg, declaredType: "image/jpeg", size: jpeg.length },
      LIMITS.photos.max,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("too_many");
  });

  it("rejects an oversized file", () => {
    const r = validatePhoto(
      { bytes: jpeg, declaredType: "image/jpeg", size: LIMITS.photos.maxBytes + 1 },
      0,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("too_large");
  });

  it("rejects an empty file", () => {
    const r = validatePhoto({ bytes: new Uint8Array(), declaredType: "image/jpeg", size: 0 }, 0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("empty");
  });
});
