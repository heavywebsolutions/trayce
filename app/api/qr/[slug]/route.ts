import { qrSvg, qrContentFor, redirectUrlFor } from "@/lib/qr";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the QR as a downloadable SVG. For dynamic codes it encodes the scan
// link; for static codes it encodes the destination directly. Looks up the code
// by slug (QR content is inherently public, so no auth needed here).
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  let content = redirectUrlFor(slug); // safe default (dynamic)
  try {
    const admin = createAdminClient();
    const { data: code } = await admin
      .from("codes")
      .select("type, slug, destination_url, content_type")
      .eq("slug", slug)
      .maybeSingle();
    if (code) content = qrContentFor(code);
  } catch {
    // Service role not configured — fall back to the dynamic redirect link.
  }

  const svg = await qrSvg(content);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="qr-${slug}.svg"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
