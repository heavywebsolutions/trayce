import { describe, it, expect } from "vitest";
import { buildPayload, hasRequired } from "@/lib/codeContent";

describe("buildPayload", () => {
  it("phone strips formatting", () => {
    expect(buildPayload("phone", { number: "(555) 123-4567" })).toBe(
      "tel:5551234567"
    );
  });
  it("sms keeps message", () => {
    expect(buildPayload("sms", { number: "+15551234567", message: "hi" })).toBe(
      "SMSTO:+15551234567:hi"
    );
  });
  it("email encodes subject and body", () => {
    expect(
      buildPayload("email", { to: "a@b.com", subject: "Hi there", body: "x y" })
    ).toBe("mailto:a@b.com?subject=Hi%20there&body=x%20y");
  });
  it("wifi WPA includes password", () => {
    expect(
      buildPayload("wifi", { ssid: "Net", password: "pw", encryption: "WPA" })
    ).toBe("WIFI:T:WPA;S:Net;P:pw;;");
  });
  it("wifi nopass omits password", () => {
    expect(
      buildPayload("wifi", { ssid: "Open", encryption: "nopass" })
    ).toBe("WIFI:T:nopass;S:Open;;");
  });
  it("vcard builds a v3.0 card", () => {
    const v = buildPayload("vcard", {
      firstName: "Jane",
      lastName: "Doe",
      email: "j@d.com",
    });
    expect(v).toContain("BEGIN:VCARD");
    expect(v).toContain("VERSION:3.0");
    expect(v).toContain("N:Doe;Jane");
    expect(v).toContain("FN:Jane Doe");
    expect(v).toContain("EMAIL:j@d.com");
    expect(v).toContain("END:VCARD");
  });
});

describe("hasRequired", () => {
  it("url needs a non-empty url", () => {
    expect(hasRequired("url", { url: "x" })).toBe(true);
    expect(hasRequired("url", { url: "  " })).toBe(false);
  });
  it("wifi needs an ssid", () => {
    expect(hasRequired("wifi", { ssid: "Net" })).toBe(true);
    expect(hasRequired("wifi", {})).toBe(false);
  });
  it("vcard needs a name", () => {
    expect(hasRequired("vcard", { firstName: "Jane" })).toBe(true);
    expect(hasRequired("vcard", {})).toBe(false);
  });
});
