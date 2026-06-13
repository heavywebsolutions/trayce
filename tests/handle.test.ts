import { describe, it, expect } from "vitest";
import { normalizeHandle } from "@/lib/handle";

describe("normalizeHandle", () => {
  it("strips a literal leading @ and lowercases", () => {
    expect(normalizeHandle("@DeviantInk")).toEqual({
      hadAt: true,
      handle: "deviantink",
    });
  });
  it("decodes a percent-encoded @ (the bug that caused the loop)", () => {
    expect(normalizeHandle("%40deviantink")).toEqual({
      hadAt: true,
      handle: "deviantink",
    });
  });
  it("treats a bare handle as needing canonicalization", () => {
    expect(normalizeHandle("deviantink")).toEqual({
      hadAt: false,
      handle: "deviantink",
    });
  });
  it("collapses stacked @ from a corrupted loop URL", () => {
    expect(normalizeHandle("@@@deviantink")).toEqual({
      hadAt: true,
      handle: "deviantink",
    });
  });
  it("survives malformed encoding without throwing", () => {
    expect(() => normalizeHandle("%E0%A4%A")).not.toThrow();
  });
});

// Guard: simulate the redirect cycle and prove it always terminates, in both
// the encoded and literal regimes that broke it before.
describe("bio handle redirect never loops", () => {
  const RESERVED = new Set(["dashboard", "login", "api"]);

  function route(param: string): "render" | "redirect" | "notfound" {
    const { hadAt, handle } = normalizeHandle(param);
    if (!handle || RESERVED.has(handle)) return "notfound";
    if (!hadAt) return "redirect";
    return "render";
  }

  function paramFromPath(path: string, encodeAt: boolean) {
    let seg = path.replace(/^\//, "");
    if (encodeAt) seg = seg.replace(/@/g, "%40");
    return seg;
  }

  function simulate(start: string, encodeAt: boolean): string {
    let path = start;
    for (let hops = 0; hops < 25; hops++) {
      const r = route(paramFromPath(path, encodeAt));
      if (r !== "redirect") return r;
      const { handle } = normalizeHandle(paramFromPath(path, encodeAt));
      path = `/@${handle}`;
    }
    return "loop";
  }

  for (const enc of [true, false]) {
    it(`terminates with @ ${enc ? "encoded" : "literal"}`, () => {
      expect(simulate("/@deviantink", enc)).toBe("render");
      expect(simulate("/deviantink", enc)).toBe("render");
      expect(simulate("/dashboard", enc)).toBe("notfound");
    });
  }
});
