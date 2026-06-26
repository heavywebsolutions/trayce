import { describe, it, expect } from "vitest";
import {
  channelLabel,
  isBookingChannel,
  bookingUrlFor,
  placementStats,
  channelStats,
  bookingTotals,
  tapsAsScans,
  type PlacementLite,
  type TapLite,
  type LeadLite,
} from "@/lib/booking";

const placements: PlacementLite[] = [
  { id: "flash", label: "Flash sheet", channel: "in_person" },
  { id: "ig", label: "Instagram bio", channel: "instagram" },
  { id: "counter", label: "Counter card", channel: "in_person" },
];

const taps: TapLite[] = [
  ...Array(5).fill(0).map(() => ({ placement_id: "flash", tapped_at: "2026-06-01T10:00:00Z" })),
  ...Array(3).fill(0).map(() => ({ placement_id: "ig", tapped_at: "2026-06-02T10:00:00Z" })),
  { placement_id: "counter", tapped_at: "2026-06-03T10:00:00Z" },
  { placement_id: null, tapped_at: "2026-06-03T10:00:00Z" }, // orphan tap ignored per-placement
];

const leads: LeadLite[] = [
  { placement_id: "flash", booked: true, booked_value_cents: 20000 },
  { placement_id: "flash", booked: false },
  { placement_id: "ig", booked: true, booked_value_cents: null }, // falls back to avg
];

describe("channel helpers", () => {
  it("labels known channels and defaults unknown to Other", () => {
    expect(channelLabel("instagram")).toBe("Instagram");
    expect(channelLabel("in_person")).toBe("In person (print)");
    expect(channelLabel("bogus")).toBe("Other");
    expect(channelLabel(null)).toBe("Other");
  });

  it("validates booking channels", () => {
    expect(isBookingChannel("tiktok")).toBe(true);
    expect(isBookingChannel("nope")).toBe(false);
  });
});

describe("bookingUrlFor", () => {
  it("builds a /b/<slug> url", () => {
    expect(bookingUrlFor("abc123")).toMatch(/\/b\/abc123$/);
  });
});

describe("placementStats", () => {
  it("counts taps, leads, booked and revenue per placement, sorted by taps", () => {
    const rows = placementStats({ placements, taps, leads, avgValueCents: 15000 });
    expect(rows.map((r) => r.id)).toEqual(["flash", "ig", "counter"]);

    const flash = rows.find((r) => r.id === "flash")!;
    expect(flash.taps).toBe(5);
    expect(flash.leads).toBe(2);
    expect(flash.booked).toBe(1);
    expect(flash.revenueCents).toBe(20000); // own logged value

    const ig = rows.find((r) => r.id === "ig")!;
    expect(ig.booked).toBe(1);
    expect(ig.revenueCents).toBe(15000); // booked lead with null value -> avg

    const counter = rows.find((r) => r.id === "counter")!;
    expect(counter.taps).toBe(1);
    expect(counter.leads).toBe(0);
  });

  it("includes placements with no activity", () => {
    const rows = placementStats({ placements, taps: [], leads: [], avgValueCents: null });
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.taps === 0 && r.revenueCents === 0)).toBe(true);
  });
});

describe("channelStats", () => {
  it("rolls placement stats up to channels", () => {
    const rows = channelStats(placementStats({ placements, taps, leads, avgValueCents: 15000 }));
    const inPerson = rows.find((r) => r.channel === "in_person")!;
    expect(inPerson.taps).toBe(6); // flash 5 + counter 1
    const ig = rows.find((r) => r.channel === "instagram")!;
    expect(ig.taps).toBe(3);
    expect(ig.label).toBe("Instagram");
  });
});

describe("bookingTotals", () => {
  it("totals taps, leads, booked and revenue across the link", () => {
    const t = bookingTotals({ taps, leads, avgValueCents: 15000 });
    expect(t.taps).toBe(10); // includes the orphan tap
    expect(t.leads).toBe(3);
    expect(t.booked).toBe(2);
    expect(t.revenueCents).toBe(35000); // 20000 + 15000 avg fallback
  });
});

describe("tapsAsScans", () => {
  it("maps tapped_at to scanned_at so analytics bucketize can chart taps", () => {
    const scans = tapsAsScans([{ placement_id: "x", tapped_at: "2026-06-01T00:00:00Z", ip_hash: "h" }]);
    expect(scans[0].scanned_at).toBe("2026-06-01T00:00:00Z");
    expect(scans[0].ip_hash).toBe("h");
  });
});
