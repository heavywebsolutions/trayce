import { describe, it, expect } from "vitest";
import { productHandleFromInput, formatPrice } from "@/lib/shopify";

describe("productHandleFromInput", () => {
  it("extracts a handle from a product URL", () => {
    expect(productHandleFromInput("https://shop.com/products/Cool-Wrap")).toBe(
      "cool-wrap"
    );
  });
  it("accepts a bare handle", () => {
    expect(productHandleFromInput("cool-wrap")).toBe("cool-wrap");
  });
  it("rejects junk and empty", () => {
    expect(productHandleFromInput("not a handle!")).toBeNull();
    expect(productHandleFromInput("")).toBeNull();
  });
});

describe("formatPrice", () => {
  it("formats USD", () => {
    expect(formatPrice("19.99", "USD")).toBe("$19.99");
  });
  it("returns empty when there is no price", () => {
    expect(formatPrice(null, "USD")).toBe("");
  });
});
