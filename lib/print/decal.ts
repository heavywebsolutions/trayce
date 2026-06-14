// Shared decal compositor. Wraps a code image (the customer's designed code, or
// a plain code) in the decal: shape, background, optional border, and a call to
// action. The SAME function powers the live configurator preview and the
// server-side print file, so what the customer sees is what gets printed.

export type DecalShape = "square" | "rounded" | "circle";
export type CtaPosition = "below" | "above";

export type DecalOptions = {
  shape: DecalShape;
  bgColor: string;
  border: boolean;
  borderColor: string;
  cta: string; // empty string = no call to action
  ctaPosition: CtaPosition;
};

export const CTA_PRESETS = [
  "Scan to leave a review",
  "View the menu",
  "Enter the giveaway",
  "Scan for the deal",
  "Follow us",
  "Scan to order",
];

export const DEFAULT_DECAL: DecalOptions = {
  shape: "rounded",
  bgColor: "#FFFFFF",
  border: false,
  borderColor: "#0A2540",
  cta: "",
  ctaPosition: "below",
};

function escapeXml(s: string): string {
  return s.replace(
    /[<>&"']/g,
    (c) =>
      (({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string)
  );
}

// Pick a readable text color (near-black or white) for a given background.
export function readableOn(hex: string): string {
  const h = (hex || "").replace("#", "");
  if (h.length < 6) return "#0A2540";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#0A2540";
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0A2540" : "#FFFFFF";
}

// codeHref: a URL or data: URL pointing at the code image (SVG or PNG).
export function composeDecalSvg(codeHref: string, o: DecalOptions): string {
  const S = 760;
  const hasCta = o.cta.trim().length > 0;
  const rx = o.shape === "circle" ? S / 2 : o.shape === "rounded" ? 64 : 0;
  const strokeW = o.border ? 12 : 0;
  const inset = strokeW / 2;

  const card = `<rect x="${inset}" y="${inset}" width="${S - strokeW}" height="${
    S - strokeW
  }" rx="${Math.max(0, rx - inset)}" fill="${o.bgColor}"${
    o.border ? ` stroke="${o.borderColor}" stroke-width="${strokeW}"` : ""
  }/>`;

  const codeSize = hasCta ? 470 : 560;
  const codeX = (S - codeSize) / 2;
  let codeY: number;
  let ctaY: number;
  if (hasCta && o.ctaPosition === "above") {
    ctaY = 110;
    codeY = 190;
  } else if (hasCta) {
    codeY = 110;
    ctaY = codeY + codeSize + 75;
  } else {
    codeY = (S - codeSize) / 2;
    ctaY = 0;
  }

  const codeEl = `<image x="${codeX}" y="${codeY}" width="${codeSize}" height="${codeSize}" href="${codeHref}" preserveAspectRatio="xMidYMid meet"/>`;

  const ctaEl = hasCta
    ? `<text x="${S / 2}" y="${ctaY}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="700" fill="${readableOn(
        o.bgColor
      )}" text-anchor="middle" dominant-baseline="middle">${escapeXml(
        o.cta.trim().slice(0, 40)
      )}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${card}${codeEl}${ctaEl}</svg>`;
}

// Parse decal options off an order's options jsonb, filling safe defaults.
export function decalFromOptions(
  options: Record<string, unknown> | null | undefined
): DecalOptions {
  const o = options ?? {};
  const shape = (["square", "rounded", "circle"] as const).includes(
    o.shape as DecalShape
  )
    ? (o.shape as DecalShape)
    : DEFAULT_DECAL.shape;
  const ctaPosition = o.cta_position === "above" ? "above" : "below";
  return {
    shape,
    bgColor: typeof o.bg_color === "string" ? o.bg_color : DEFAULT_DECAL.bgColor,
    border: o.border === true || o.border === "true",
    borderColor:
      typeof o.border_color === "string"
        ? o.border_color
        : DEFAULT_DECAL.borderColor,
    cta: typeof o.cta === "string" ? o.cta : "",
    ctaPosition,
  };
}
