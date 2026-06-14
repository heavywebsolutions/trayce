import { describe, it, expect } from "vitest";
import {
  composeDecalSvg,
  decalFromOptions,
  DEFAULT_DECAL,
} from "@/lib/print/decal";

describe("decal compositor", () => {
  it("produces an SVG embedding the code image", () => {
    const svg = composeDecalSvg("data:image/svg+xml,abc", DEFAULT_DECAL);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("<image");
  });

  it("renders the call to action text when present", () => {
    const svg = composeDecalSvg("href", { ...DEFAULT_DECAL, cta: "View the menu" });
    expect(svg).toContain("View the menu");
    expect(svg).toContain("<text");
  });

  it("omits the text element when there is no call to action", () => {
    const svg = composeDecalSvg("href", { ...DEFAULT_DECAL, cta: "" });
    expect(svg).not.toContain("<text");
  });

  it("escapes markup in the call to action", () => {
    const svg = composeDecalSvg("href", { ...DEFAULT_DECAL, cta: "<script>" });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("falls back to safe defaults on junk options", () => {
    const d = decalFromOptions({ shape: "weird", cta_position: "nope" });
    expect(d.shape).toBe(DEFAULT_DECAL.shape);
    expect(d.ctaPosition).toBe("below");
  });
});
