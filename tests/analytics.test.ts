import { describe, it, expect } from "vitest";
import { resolveRange, bucketize, uniqueCount } from "@/lib/analytics";
import type { ScanLite } from "@/lib/analytics";

const scan = (over: Partial<ScanLite>): ScanLite => ({
  scanned_at: "2026-01-01T10:00:00.000Z",
  device_type: null,
  city: null,
  region: null,
  country: null,
  user_agent: null,
  ip_hash: null,
  ...over,
});

describe("resolveRange", () => {
  it("defaults to a 30-day daily range", () => {
    const r = resolveRange({});
    expect(r.preset).toBe(30);
    expect(r.gran).toBe("day");
  });
  it("honors preset and granularity", () => {
    const r = resolveRange({ r: "7", g: "week" });
    expect(r.preset).toBe(7);
    expect(r.gran).toBe("week");
  });
  it("uses a custom from/to range", () => {
    const r = resolveRange({ from: "2026-01-01", to: "2026-01-31" });
    expect(r.preset).toBeNull();
    expect(r.from.toISOString().slice(0, 10)).toBe("2026-01-01");
  });
});

describe("uniqueCount", () => {
  it("dedupes by ip_hash, counts nulls individually", () => {
    expect(
      uniqueCount([
        scan({ ip_hash: "a" }),
        scan({ ip_hash: "a" }),
        scan({ ip_hash: "b" }),
        scan({ ip_hash: null }),
      ])
    ).toBe(3);
  });
});

describe("bucketize", () => {
  it("buckets totals and uniques per day with no gaps", () => {
    const range = resolveRange({ from: "2026-01-01", to: "2026-01-03", g: "day" });
    const b = bucketize(
      [
        scan({ scanned_at: "2026-01-01T10:00:00.000Z", ip_hash: "a" }),
        scan({ scanned_at: "2026-01-01T12:00:00.000Z", ip_hash: "a" }),
        scan({ scanned_at: "2026-01-02T09:00:00.000Z", ip_hash: null }),
      ],
      range
    );
    expect(b).toHaveLength(3);
    expect(b[0]).toMatchObject({ total: 2, unique: 1 });
    expect(b[1]).toMatchObject({ total: 1, unique: 1 });
    expect(b[2]).toMatchObject({ total: 0, unique: 0 });
  });
});
