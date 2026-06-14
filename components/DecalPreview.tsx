import { readableOn, fontStack, type DecalOptions } from "@/lib/print/decal";

// Renders the decal preview with real HTML/CSS (not an SVG-in-img), so the code
// image always loads and the shape, background, border, logo, CTA, and URL
// render crisply. Used by the configurator and the proof screen. The
// downloadable print file is produced as a true SVG via composeDecalSvg.
export function DecalPreview({
  codeHref,
  options,
  className,
  fontPx = 17,
}: {
  codeHref: string;
  options: DecalOptions;
  className?: string;
  fontPx?: number;
}) {
  const { shape, bgColor, border, borderColor, cta, ctaPosition } = options;
  const fam = fontStack(options.font);
  const color = readableOn(bgColor);
  const upper = options.ctaUppercase !== false;
  const ctaRaw = (cta || "").trim();
  const hasCta = ctaRaw.length > 0;
  const ctaText = upper ? ctaRaw.toUpperCase() : ctaRaw;
  const logo = options.logo || null;
  const urlText = (options.urlText || "").trim();
  const showUrl = !!options.showUrl && urlText.length > 0;
  const urlPos = options.urlPosition === "top" ? "top" : "bottom";
  const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "12%" : "0";

  const ctaEl = hasCta ? (
    <span
      style={{
        color,
        fontFamily: fam,
        fontWeight: 700,
        fontSize: fontPx,
        lineHeight: 1.15,
        textAlign: "center",
      }}
    >
      {ctaText}
    </span>
  ) : null;

  const urlEl = showUrl ? (
    <span
      style={{
        color,
        opacity: 0.85,
        fontFamily: fam,
        fontWeight: 600,
        fontSize: Math.max(8, fontPx * 0.62),
        textAlign: "center",
        wordBreak: "break-all",
      }}
    >
      {urlText}
    </span>
  ) : null;

  const logoEl = logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      style={{ maxHeight: fontPx * 2.4, maxWidth: "60%", objectFit: "contain" }}
    />
  ) : null;

  return (
    <div
      className={className}
      style={{
        aspectRatio: "1 / 1",
        background: bgColor,
        borderRadius: radius,
        border: border ? `6px solid ${borderColor}` : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4%",
        padding: "11%",
        boxSizing: "border-box",
      }}
    >
      {showUrl && urlPos === "top" && urlEl}
      {logoEl}
      {ctaPosition === "above" && ctaEl}
      {codeHref ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={codeHref}
          alt="Your code"
          style={{ width: "72%", maxHeight: "62%", height: "auto", objectFit: "contain" }}
        />
      ) : null}
      {ctaPosition === "below" && ctaEl}
      {showUrl && urlPos === "bottom" && urlEl}
    </div>
  );
}
