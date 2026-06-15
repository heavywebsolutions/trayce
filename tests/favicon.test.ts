import { describe, it, expect } from "vitest";
import { faviconFor } from "@/lib/bio";

describe("faviconFor", () => {
  it("returns a favicon URL for a normal https link", () => {
    const f = faviconFor("https://www.dennis-kirk.com/parts");
    expect(f).toContain("www.google.com/s2/favicons");
    expect(f).toContain("domain=www.dennis-kirk.com");
    expect(f).toContain("sz=128");
  });

  it("uses only the hostname, not the path or query", () => {
    const f = faviconFor("https://shop.example.com/a/b?c=d");
    expect(f).toContain("domain=shop.example.com");
    expect(f).not.toContain("/a/b");
  });

  it("returns null for empty, invalid, or non-http URLs", () => {
    expect(faviconFor("")).toBeNull();
    expect(faviconFor("not a url")).toBeNull();
    expect(faviconFor("mailto:hi@example.com")).toBeNull();
    expect(faviconFor("javascript:alert(1)")).toBeNull();
  });
});
