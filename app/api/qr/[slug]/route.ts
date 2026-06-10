import { qrSvg, redirectUrlFor } from "@/lib/qr";

// Returns the QR as a downloadable SVG. The QR just encodes the public scan URL,
// so no auth or DB lookup is needed here.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const svg = await qrSvg(redirectUrlFor(slug));
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="qr-${slug}.svg"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
