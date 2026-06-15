// Shared decal compositor. Wraps a code image (the customer's designed code, or
// a plain code) in the decal: shape, background, border, optional brand logo,
// call to action, and URL. The SAME function powers the live configurator
// preview and the server-side print file, so what the customer sees is what
// gets printed.

export type DecalShape = "square" | "rounded" | "circle";
export type CtaPosition = "below" | "above";
export type UrlPosition = "top" | "bottom";

export type DecalOptions = {
  shape: DecalShape;
  bgColor: string;
  border: boolean;
  borderColor: string;
  cta: string; // empty string = no call to action
  ctaPosition: CtaPosition;
  // Optional extras (defaulted everywhere they are read).
  ctaUppercase?: boolean;
  font?: string; // font key from FONT_OPTIONS
  logo?: string | null; // data URL of a brand logo placed on the decal
  showUrl?: boolean;
  urlText?: string;
  urlPosition?: UrlPosition;
};

export const CTA_PRESETS = [
  "Scan to leave a review",
  "View the menu",
  "Enter the giveaway",
  "Scan for the deal",
  "Follow us",
  "Scan to order",
];

// 10 popular display/sans/serif/script fonts for the call to action.
export const FONT_OPTIONS: { key: string; name: string; stack: string }[] = [
  { key: "inter", name: "Inter", stack: "'Inter', system-ui, sans-serif" },
  { key: "poppins", name: "Poppins", stack: "'Poppins', sans-serif" },
  { key: "montserrat", name: "Montserrat", stack: "'Montserrat', sans-serif" },
  { key: "oswald", name: "Oswald", stack: "'Oswald', sans-serif" },
  { key: "bebas", name: "Bebas Neue", stack: "'Bebas Neue', sans-serif" },
  { key: "anton", name: "Anton", stack: "'Anton', sans-serif" },
  { key: "roboto", name: "Roboto", stack: "'Roboto', sans-serif" },
  { key: "lato", name: "Lato", stack: "'Lato', sans-serif" },
  { key: "playfair", name: "Playfair Display", stack: "'Playfair Display', serif" },
  { key: "pacifico", name: "Pacifico", stack: "'Pacifico', cursive" },
];

export function fontStack(key?: string): string {
  return (
    FONT_OPTIONS.find((f) => f.key === key)?.stack ??
    "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  );
}

// Stylesheet that loads the 10 fonts (weights 600/700 where available).
export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@600;700&family=Poppins:wght@600;700&family=Montserrat:wght@600;700&family=Oswald:wght@600;700&family=Bebas+Neue&family=Anton&family=Roboto:wght@700&family=Lato:wght@700&family=Playfair+Display:wght@700&family=Pacifico&display=swap";

export const DEFAULT_DECAL: DecalOptions = {
  shape: "rounded",
  bgColor: "#FFFFFF",
  border: false,
  borderColor: "#0A2540",
  cta: "",
  ctaPosition: "below",
  ctaUppercase: true,
  font: "inter",
  logo: null,
  showUrl: false,
  urlText: "",
  urlPosition: "bottom",
};

export type DecalTemplate = {
  key: string;
  name: string;
  decal: DecalOptions;
};

// Starter layouts customers can pick, then swap the call to action for their own.
export const DECAL_TEMPLATES: DecalTemplate[] = [
  {
    key: "review",
    name: "Review booster",
    decal: {
      shape: "circle",
      bgColor: "#FFFFFF",
      border: false,
      borderColor: "#0A2540",
      cta: "Scan to leave a review",
      ctaPosition: "below",
    },
  },
  {
    key: "menu",
    name: "Menu",
    decal: {
      shape: "rounded",
      bgColor: "#0A2540",
      border: false,
      borderColor: "#0A2540",
      cta: "View the menu",
      ctaPosition: "below",
    },
  },
  {
    key: "giveaway",
    name: "Giveaway",
    decal: {
      shape: "rounded",
      bgColor: "#2587DE",
      border: false,
      borderColor: "#2587DE",
      cta: "Enter the giveaway",
      ctaPosition: "above",
    },
  },
  {
    key: "follow",
    name: "Follow us",
    decal: {
      shape: "circle",
      bgColor: "#FFFFFF",
      border: true,
      borderColor: "#0A2540",
      cta: "Follow us",
      ctaPosition: "below",
    },
  },
  {
    key: "order",
    name: "Order now",
    decal: {
      shape: "square",
      bgColor: "#FFFFFF",
      border: true,
      borderColor: "#2587DE",
      cta: "Scan to order",
      ctaPosition: "below",
    },
  },
  {
    key: "review_sign",
    name: "Review sign",
    decal: {
      shape: "rounded",
      bgColor: "#FFFFFF",
      border: false,
      borderColor: "#0A2540",
      cta: "Scan to leave a review",
      ctaPosition: "below",
      showUrl: true,
    },
  },
  {
    key: "order_sign",
    name: "Order online sign",
    decal: {
      shape: "rounded",
      bgColor: "#FFFFFF",
      border: false,
      borderColor: "#2587DE",
      cta: "Scan to order online",
      ctaPosition: "below",
      showUrl: true,
    },
  },
];

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
  const P = 70;
  const gap = 22;

  const fam = fontStack(o.font);
  const textColor = readableOn(o.bgColor);
  const upper = o.ctaUppercase !== false;
  const ctaRaw = (o.cta || "").trim();
  const hasCta = ctaRaw.length > 0;
  const ctaText = upper ? ctaRaw.toUpperCase() : ctaRaw;
  const logo = o.logo || null;
  const urlText = (o.urlText || "").trim();
  const showUrl = !!o.showUrl && urlText.length > 0;
  const urlPos: UrlPosition = o.urlPosition === "top" ? "top" : "bottom";

  const rx = o.shape === "circle" ? S / 2 : o.shape === "rounded" ? 64 : 0;
  const strokeW = o.border ? 12 : 0;
  const inset = strokeW / 2;
  const card = `<rect x="${inset}" y="${inset}" width="${S - strokeW}" height="${
    S - strokeW
  }" rx="${Math.max(0, rx - inset)}" fill="${o.bgColor}"${
    o.border ? ` stroke="${o.borderColor}" stroke-width="${strokeW}"` : ""
  }/>`;

  type Item = { kind: "url" | "logo" | "cta" | "code"; h: number };
  const URLH = 40,
    LOGOH = 96,
    CTAH = 64;
  const items: Item[] = [];
  if (showUrl && urlPos === "top") items.push({ kind: "url", h: URLH });
  if (logo) items.push({ kind: "logo", h: LOGOH });
  if (hasCta && o.ctaPosition === "above") items.push({ kind: "cta", h: CTAH });
  items.push({ kind: "code", h: 0 });
  if (hasCta && o.ctaPosition === "below") items.push({ kind: "cta", h: CTAH });
  if (showUrl && urlPos === "bottom") items.push({ kind: "url", h: URLH });

  const avail = S - 2 * P;
  const fixed =
    items.filter((i) => i.kind !== "code").reduce((a, i) => a + i.h, 0) +
    gap * (items.length - 1);
  const codeH = Math.max(260, avail - fixed);
  const codeItem = items.find((i) => i.kind === "code");
  if (codeItem) codeItem.h = codeH;
  const codeSize = Math.min(codeH, avail);

  let y = P;
  const els: string[] = [card];
  for (const it of items) {
    if (it.kind === "url") {
      els.push(
        `<text x="${S / 2}" y="${y + it.h / 2}" font-family="${fam}" font-size="28" font-weight="600" fill="${textColor}" opacity="0.85" text-anchor="middle" dominant-baseline="central">${escapeXml(urlText)}</text>`
      );
    } else if (it.kind === "logo" && logo) {
      const lw = 220;
      els.push(
        `<image x="${(S - lw) / 2}" y="${y}" width="${lw}" height="${it.h}" href="${logo}" preserveAspectRatio="xMidYMid meet"/>`
      );
    } else if (it.kind === "cta") {
      els.push(
        `<text x="${S / 2}" y="${y + it.h / 2}" font-family="${fam}" font-size="46" font-weight="700" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${escapeXml(ctaText)}</text>`
      );
    } else if (it.kind === "code") {
      els.push(
        `<image x="${(S - codeSize) / 2}" y="${y}" width="${codeSize}" height="${it.h}" href="${codeHref}" preserveAspectRatio="xMidYMid meet"/>`
      );
    }
    y += it.h + gap;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${els.join("")}</svg>`;
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
  return {
    shape,
    bgColor: typeof o.bg_color === "string" ? o.bg_color : DEFAULT_DECAL.bgColor,
    border: o.border === true || o.border === "true",
    borderColor:
      typeof o.border_color === "string"
        ? o.border_color
        : DEFAULT_DECAL.borderColor,
    cta: typeof o.cta === "string" ? o.cta : "",
    ctaPosition: o.cta_position === "above" ? "above" : "below",
    ctaUppercase: o.cta_uppercase !== false && o.cta_uppercase !== "false",
    font: typeof o.font === "string" ? o.font : DEFAULT_DECAL.font,
    logo: typeof o.logo === "string" ? o.logo : null,
    showUrl: o.show_url === true || o.show_url === "true",
    urlText: typeof o.url_text === "string" ? o.url_text : "",
    urlPosition: o.url_position === "top" ? "top" : "bottom",
  };
}
