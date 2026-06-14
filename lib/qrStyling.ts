// Client-side renderer that composes a designed code (styled QR + frame + label)
// into a self-contained SVG, from the code's saved design columns. Mirrors the
// Qr designer exactly so Print & Ship shows and prints the same artwork. Used to
// render the preview and to backfill design_svg for codes designed before that
// column existed.

export type CodeDesign = {
  fg: string;
  bg: string;
  dot: string;
  corner: string;
  logo: string | null;
  frame: string;
  frameColor: string;
  frameText: string;
};

function layoutFor(frame: string) {
  const Q = 600,
    pad = 32,
    bar = 84,
    gap = 16;
  if (frame === "bottom")
    return {
      Q,
      W: Q + pad * 2,
      H: pad + Q + gap + bar + pad,
      qrX: pad,
      qrY: pad,
      bar: { x: pad, y: pad + Q + gap, w: Q, h: bar },
      border: false,
    };
  if (frame === "top")
    return {
      Q,
      W: Q + pad * 2,
      H: pad + bar + gap + Q + pad,
      qrX: pad,
      qrY: pad + bar + gap,
      bar: { x: pad, y: pad, w: Q, h: bar },
      border: false,
    };
  if (frame === "border")
    return {
      Q,
      W: Q + pad * 2,
      H: pad + Q + gap + bar + pad,
      qrX: pad,
      qrY: pad,
      bar: { x: pad, y: pad + Q + gap, w: Q, h: bar },
      border: true,
    };
  return {
    Q,
    W: Q + pad * 2,
    H: Q + pad * 2,
    qrX: pad,
    qrY: pad,
    bar: null as null | { x: number; y: number; w: number; h: number },
    border: false,
  };
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(blob);
  });
}

export async function buildDesignSvg(
  content: string,
  d: CodeDesign
): Promise<string> {
  const mod = await import("qr-code-styling");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const QRCodeStyling: any = (mod as any).default;
  const qr = new QRCodeStyling({
    width: 600,
    height: 600,
    type: "canvas",
    data: content,
    margin: 10,
    qrOptions: { errorCorrectionLevel: d.logo ? "H" : "M" },
    dotsOptions: { color: d.fg, type: d.dot },
    backgroundOptions: { color: d.bg },
    cornersSquareOptions: { color: d.fg, type: d.corner },
    cornersDotOptions: {
      color: d.fg,
      type: d.corner === "extra-rounded" ? "dot" : d.corner,
    },
    image: d.logo ?? undefined,
    imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.25 },
  });

  let blob: Blob | null = null;
  try {
    blob = (await qr.getRawData("png")) as Blob | null;
  } catch {
    return "";
  }
  if (!blob) return "";
  const qrUrl = await blobToDataURL(blob);

  const L = layoutFor(d.frame);
  const safeText = (d.frameText || "").replace(/[<&>]/g, "");
  const bgRect = L.border
    ? `<rect width="${L.W}" height="${L.H}" rx="36" fill="${d.frameColor}"/>`
    : `<rect width="${L.W}" height="${L.H}" fill="#FFFFFF"/>`;
  const barEl =
    L.bar && !L.border
      ? `<rect x="${L.bar.x}" y="${L.bar.y}" width="${L.bar.w}" height="${L.bar.h}" rx="16" fill="${d.frameColor}"/>`
      : "";
  const textEl = L.bar
    ? `<text x="${L.bar.x + L.bar.w / 2}" y="${L.bar.y + L.bar.h / 2}" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="40" font-weight="600" text-anchor="middle" dominant-baseline="central">${safeText}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}">${bgRect}<image x="${L.qrX}" y="${L.qrY}" width="${L.Q}" height="${L.Q}" href="${qrUrl}"/>${barEl}${textEl}</svg>`;
}
