import { describe, it, expect } from "vitest";
import { resolveLeadRange, unifyLeads, topSources } from "@/lib/leads";

const pageName = new Map([
  ["p1", "@deviantink"],
  ["p2", "Spring Tour"],
]);

describe("resolveLeadRange", () => {
  it("defaults to 30 days for unknown keys", () => {
    expect(resolveLeadRange("bogus").key).toBe("30");
    expect(resolveLeadRange(undefined).key).toBe("30");
  });

  it("today starts at UTC midnight", () => {
    const { from, key } = resolveLeadRange("today");
    expect(key).toBe("today");
    expect(from.getUTCHours()).toBe(0);
    expect(from.getUTCMinutes()).toBe(0);
  });

  it("yesterday is a full prior-day window", () => {
    const { from, to } = resolveLeadRange("yesterday");
    const days = Math.round((+to - +from) / 86400000);
    expect(days).toBe(1);
  });

  it("all time reaches back to the epoch", () => {
    expect(resolveLeadRange("all").from.getTime()).toBe(0);
  });
});

describe("unifyLeads", () => {
  const result = unifyLeads({
    leads: [
      {
        email: "a@x.com",
        name: "Ann",
        phone: "555",
        created_at: "2026-06-10T10:00:00Z",
        code_id: "c1",
        codes: { title: "Menu code" },
      },
      {
        email: "b@x.com",
        name: "Bob",
        created_at: "2026-06-12T10:00:00Z",
        code_id: null,
        page_id: "p1",
        source: "Newsletter",
      },
    ],
    subscribers: [
      {
        email: "c@x.com",
        created_at: "2026-06-11T10:00:00Z",
        page_id: "p1",
      },
    ],
    pageName,
  });

  it("tags QR-code leads", () => {
    const ann = result.find((r) => r.email === "a@x.com")!;
    expect(ann.sourceType).toBe("qr");
    expect(ann.sourceLabel).toBe("Menu code");
  });

  it("tags bio form leads with the page name + form detail", () => {
    const bob = result.find((r) => r.email === "b@x.com")!;
    expect(bob.sourceType).toBe("bio");
    expect(bob.sourceLabel).toBe("@deviantink");
    expect(bob.sourceDetail).toBe("Newsletter");
  });

  it("folds in bio subscribers as bio leads", () => {
    const c = result.find((r) => r.email === "c@x.com")!;
    expect(c.sourceType).toBe("bio");
    expect(c.sourceDetail).toBe("Subscriber");
  });

  it("returns newest first", () => {
    expect(result.map((r) => r.email)).toEqual([
      "b@x.com",
      "c@x.com",
      "a@x.com",
    ]);
  });

  it("ranks top sources by volume", () => {
    const ranked = topSources(result);
    expect(ranked[0]).toMatchObject({ label: "@deviantink", count: 2 });
  });
});

describe("unifyLeads booking source", () => {
  const result = unifyLeads({
    leads: [
      {
        email: "d@x.com",
        name: "Dee",
        created_at: "2026-06-13T10:00:00Z",
        code_id: null,
        page_id: null,
        booking_link_id: "bl1",
        placement_id: "pl1",
        source: "Booking · Flash sheet",
      },
    ],
    subscribers: [],
    pageName: new Map(),
    bookingName: new Map([["bl1", "Tattoo sessions"]]),
  });

  it("tags booking leads with the link name + placement detail", () => {
    const d = result.find((r) => r.email === "d@x.com")!;
    expect(d.sourceType).toBe("booking");
    expect(d.sourceLabel).toBe("Tattoo sessions");
    expect(d.sourceDetail).toBe("Flash sheet");
  });

  it("falls back to a generic label when the link name is unknown", () => {
    const r = unifyLeads({
      leads: [
        {
          email: "e@x.com",
          created_at: "2026-06-13T10:00:00Z",
          booking_link_id: "missing",
          source: "Booking · Counter card",
        },
      ],
      subscribers: [],
      pageName: new Map(),
    });
    expect(r[0].sourceType).toBe("booking");
    expect(r[0].sourceLabel).toBe("Booking");
    expect(r[0].sourceDetail).toBe("Counter card");
  });
});
