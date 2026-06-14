import { describe, it, expect } from "vitest";
import { priceFor } from "@/lib/print/catalog";

describe("print pricing", () => {
  it("computes unit and total for a valid base selection", () => {
    const r = priceFor("die_cut_decal", "2in", "matte", 25);
    expect(r).not.toBeNull();
    expect(r!.unitPriceCents).toBe(150); // base size multiplier 1.0
    expect(r!.totalCents).toBe(150 * 25);
  });

  it("applies the size multiplier", () => {
    const base = priceFor("die_cut_decal", "2in", "matte", 25)!;
    const bigger = priceFor("die_cut_decal", "4in", "matte", 25)!;
    expect(bigger.unitPriceCents).toBe(Math.round(base.unitPriceCents * 1.9));
  });

  it("total always equals unit times the tier quantity", () => {
    const r = priceFor("window_decal", "6in", "clear", 50)!;
    expect(r.totalCents).toBe(r.unitPriceCents * 50);
  });

  it("rejects an invalid quantity tier", () => {
    expect(priceFor("die_cut_decal", "2in", "matte", 37)).toBeNull();
  });

  it("rejects an unknown product", () => {
    expect(priceFor("nope", "2in", "matte", 25)).toBeNull();
  });
});
