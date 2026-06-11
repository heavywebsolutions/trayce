import { type NextRequest } from "next/server";
import { qrSvg } from "@/lib/qr";

// QR (SVG) that encodes the public bio-page URL.
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ handle: string }> }
) {
  const { handle } = await ctx.params;
  const origin =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const url = `${origin.replace(/\/$/, "")}/p/${handle}`;
  const svg = await qrSvg(url);
  const download = new URL(request.url).searchParams.has("dl");
  const headers: Record<string, string> = {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=300",
  };
  if (download) {
    headers["Content-Disposition"] = `attachment; filename="bio-${handle}.svg"`;
  }
  return new Response(svg, { headers });
}
