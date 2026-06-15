import { describe, it, expect } from "vitest";
import { activeBioPageIds, isOverBioLimit } from "@/lib/bioLimit";

const p = (id: string, day: number, paused = false) => ({
  id,
  created_at: `2026-01-${String(day).padStart(2, "0")}T00:00:00Z`,
  paused,
});

describe("activeBioPageIds", () => {
  it("keeps every page when the plan is unlimited", () => {
    const pages = [p("a", 1), p("b", 2), p("c", 3)];
    const live = activeBioPageIds(pages, Infinity);
    expect(live.size).toBe(3);
  });

  it("falls back to the oldest page when no choice was made", () => {
    const pages = [p("new", 3), p("old", 1), p("mid", 2)];
    const live = activeBioPageIds(pages, 1);
    expect([...live]).toEqual(["old"]);
  });

  it("honors an explicit choice within the limit", () => {
    const pages = [p("a", 1, true), p("b", 2, false), p("c", 3, true)];
    const live = activeBioPageIds(pages, 1);
    expect([...live]).toEqual(["b"]);
  });

  it("ignores a stale choice that still exceeds the limit", () => {
    // Two pages un-paused but limit is 1: not a valid choice, use oldest.
    const pages = [p("a", 2, false), p("b", 1, false)];
    const live = activeBioPageIds(pages, 1);
    expect([...live]).toEqual(["b"]);
  });

  it("returns empty for a zero limit or no pages", () => {
    expect(activeBioPageIds([p("a", 1)], 0).size).toBe(0);
    expect(activeBioPageIds([], 1).size).toBe(0);
  });
});

describe("isOverBioLimit", () => {
  it("flags free workspaces past the limit", () => {
    expect(isOverBioLimit(3, 1)).toBe(true);
    expect(isOverBioLimit(1, 1)).toBe(false);
    expect(isOverBioLimit(9, Infinity)).toBe(false);
  });
});
