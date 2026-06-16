import { describe, it, expect, beforeAll } from "vitest";

// Set price env BEFORE importing the module (PLAN_PRICES reads env at load).
beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.STRIPE_PRICE_STARTER = "price_starter_old";
  process.env.STRIPE_PRICE_GROWTH = "price_growth_old";
  process.env.STRIPE_PRICE_AGENCY = "price_agency_old";
});

describe("planFromSubscription", () => {
  it("reads the plan from subscription metadata (price-change safe)", async () => {
    const { planFromSubscription } = await import("@/lib/stripe");
    // A grandfathered customer on a brand-new Price ID we have never seen, but
    // whose subscription metadata carries the plan, still resolves correctly.
    const sub = {
      metadata: { plan: "growth" },
      items: { data: [{ price: { id: "price_growth_BRAND_NEW_2028" } }] },
    };
    expect(planFromSubscription(sub)).toBe("growth");
  });

  it("falls back to Price ID match for legacy subs with no plan metadata", async () => {
    const { planFromSubscription } = await import("@/lib/stripe");
    const sub = {
      metadata: {},
      items: { data: [{ price: { id: "price_agency_old" } }] },
    };
    expect(planFromSubscription(sub)).toBe("agency");
  });

  it("ignores a bogus metadata plan and falls back to price", async () => {
    const { planFromSubscription } = await import("@/lib/stripe");
    const sub = {
      metadata: { plan: "platinum" },
      items: { data: [{ price: { id: "price_starter_old" } }] },
    };
    expect(planFromSubscription(sub)).toBe("starter");
  });

  it("returns free when nothing matches", async () => {
    const { planFromSubscription } = await import("@/lib/stripe");
    const sub = { metadata: {}, items: { data: [{ price: { id: "price_unknown" } }] } };
    expect(planFromSubscription(sub)).toBe("free");
  });
});
