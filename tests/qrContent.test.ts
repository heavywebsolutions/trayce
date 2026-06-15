import { describe, it, expect } from "vitest";
import { qrContentFor } from "@/lib/qr";

describe("qrContentFor", () => {
  it("redirect-backs URL codes even when static (so they can be re-pointed)", () => {
    const out = qrContentFor({
      type: "static",
      slug: "abc123",
      destination_url: "https://example.com",
      content_type: "url",
    });
    expect(out).toContain("/r/abc123");
    expect(out).not.toContain("example.com");
  });

  it("redirect-backs dynamic URL codes", () => {
    const out = qrContentFor({
      type: "dynamic",
      slug: "xyz789",
      destination_url: "https://example.com",
      content_type: "url",
    });
    expect(out).toContain("/r/xyz789");
  });

  it("redirect-backs app codes (device-aware redirect)", () => {
    const out = qrContentFor({
      type: "dynamic",
      slug: "app111",
      destination_url: "https://fallback.com",
      content_type: "app",
    });
    expect(out).toContain("/r/app111");
  });

  it("encodes direct payloads (vCard, WiFi) in the QR itself", () => {
    const vcard = "BEGIN:VCARD\nFN:Jane\nEND:VCARD";
    expect(
      qrContentFor({
        type: "static",
        slug: "v1",
        destination_url: vcard,
        content_type: "vcard",
      })
    ).toBe(vcard);

    const wifi = "WIFI:T:WPA;S:Net;P:pass;;";
    expect(
      qrContentFor({
        type: "static",
        slug: "w1",
        destination_url: wifi,
        content_type: "wifi",
      })
    ).toBe(wifi);
  });

  it("defaults to redirect when content_type is missing", () => {
    const out = qrContentFor({ slug: "d1", destination_url: "https://x.com" });
    expect(out).toContain("/r/d1");
  });
});
