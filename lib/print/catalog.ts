// Print & Ship Phase 1 catalog.
//
// PLACEHOLDER PRICING. Every unitPriceCents / multiplier below is a stand-in so
// the flow works end to end. Replace with real numbers from production costs.
// Pricing model: each tier is a selectable quantity with its own per-unit price
// (volume discount baked in). Size and finish apply multipliers on top.
//   unit = round(tier.unitPriceCents * size.mult * finish.mult)
//   total = unit * quantity

export type PrintSize = {
  key: string;
  label: string;
  widthIn: number;
  heightIn: number;
  mult: number;
};

export type PrintFinish = {
  key: string;
  label: string;
  mult: number;
};

export type PrintTier = {
  qty: number;
  unitPriceCents: number; // per-unit price at the base size, before multipliers
};

export type PrintProduct = {
  key: string;
  name: string;
  blurb: string;
  sizes: PrintSize[];
  finishes: PrintFinish[];
  tiers: PrintTier[];
};

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    key: "die_cut_decal",
    name: "Die-cut decals",
    blurb:
      "Single decals cut to the shape of your code, on durable weatherproof vinyl.",
    sizes: [
      { key: "2in", label: '2"', widthIn: 2, heightIn: 2, mult: 1.0 },
      { key: "3in", label: '3"', widthIn: 3, heightIn: 3, mult: 1.4 },
      { key: "4in", label: '4"', widthIn: 4, heightIn: 4, mult: 1.9 },
      { key: "5in", label: '5"', widthIn: 5, heightIn: 5, mult: 2.5 },
    ],
    finishes: [
      { key: "matte", label: "Matte", mult: 1.0 },
      { key: "gloss", label: "Glossy", mult: 1.0 },
    ],
    tiers: [
      { qty: 25, unitPriceCents: 150 },
      { qty: 50, unitPriceCents: 110 },
      { qty: 100, unitPriceCents: 85 },
      { qty: 250, unitPriceCents: 65 },
      { qty: 500, unitPriceCents: 52 },
      { qty: 1000, unitPriceCents: 42 },
      { qty: 2500, unitPriceCents: 34 },
      { qty: 5000, unitPriceCents: 28 },
    ],
  },
  {
    key: "window_decal",
    name: "Window decals",
    blurb:
      "Clear or white vinyl decals built for storefront glass and vehicle windows.",
    sizes: [
      { key: "4in", label: '4"', widthIn: 4, heightIn: 4, mult: 1.0 },
      { key: "6in", label: '6"', widthIn: 6, heightIn: 6, mult: 1.5 },
      { key: "8in", label: '8"', widthIn: 8, heightIn: 8, mult: 2.1 },
    ],
    finishes: [
      { key: "clear", label: "Clear", mult: 1.0 },
      { key: "white", label: "White", mult: 1.0 },
    ],
    tiers: [
      { qty: 10, unitPriceCents: 400 },
      { qty: 25, unitPriceCents: 320 },
      { qty: 50, unitPriceCents: 260 },
      { qty: 100, unitPriceCents: 210 },
      { qty: 250, unitPriceCents: 170 },
      { qty: 500, unitPriceCents: 140 },
      { qty: 1000, unitPriceCents: 115 },
      { qty: 2500, unitPriceCents: 95 },
    ],
  },
];

// Optional add-on: our team vectorizes the customer's logo and removes the
// background during the proof step. Flat fee, placeholder pricing.
export const LOGO_PREP_CENTS = 1900;

export function getPrintProduct(key: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find((p) => p.key === key);
}

export type PriceResult = {
  unitPriceCents: number;
  totalCents: number;
  size: PrintSize;
  finish: PrintFinish;
  tier: PrintTier;
};

// Returns null if any selection is invalid, so callers can reject bad input
// rather than charge a guessed price.
export function priceFor(
  productKey: string,
  sizeKey: string,
  finishKey: string,
  qty: number
): PriceResult | null {
  const product = getPrintProduct(productKey);
  if (!product) return null;
  const size = product.sizes.find((s) => s.key === sizeKey);
  const finish = product.finishes.find((f) => f.key === finishKey);
  const tier = product.tiers.find((t) => t.qty === qty);
  if (!size || !finish || !tier) return null;

  const unitPriceCents = Math.round(
    tier.unitPriceCents * size.mult * finish.mult
  );
  return {
    unitPriceCents,
    totalCents: unitPriceCents * tier.qty,
    size,
    finish,
    tier,
  };
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
