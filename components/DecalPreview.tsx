import { readableOn, type DecalOptions } from "@/lib/print/decal";

// Renders the decal preview with real HTML/CSS (not an SVG-in-img), so the code
// image always loads and the shape, background, border, and CTA render crisply.
// Used by the configurator and the proof screen. The downloadable print file is
// still produced as a true SVG server-side via composeDecalSvg.
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
  const hasCta = cta.trim().length > 0;
  const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "12%" : "0";

  const ctaEl = hasCta ? (
    <span
      style={{
        color: readableOn(bgColor),
        fontWeight: 700,
        fontSize: fontPx,
        lineHeight: 1.15,
        textAlign: "center",
      }}
    >
      {cta.trim()}
    </span>
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
        gap: hasCta ? "5%" : 0,
        padding: "12%",
        boxSizing: "border-box",
      }}
    >
      {ctaPosition === "above" && ctaEl}
      {codeHref ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={codeHref}
          alt="Your code"
          style={{
            width: hasCta ? "72%" : "86%",
            height: "auto",
            objectFit: "contain",
          }}
        />
      ) : null}
      {ctaPosition === "below" && ctaEl}
    </div>
  );
}
