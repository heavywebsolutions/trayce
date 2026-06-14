import QRCode from "qrcode";
import { qrContentFor } from "@/lib/qr";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { composeDecalSvg, decalFromOptions } from "@/lib/print/decal";

// Admin-only print-ready file for an order. Returns a vector SVG (scales to any
// size with no quality loss) of the order's code, rendered with a full quiet
// zone and high error correction for durable scanning on physical media.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) {
    return new Response("Not authorized", { status: 403 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("print_orders")
    .select("id, code_id, product_key, options")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return new Response("Order not found", { status: 404 });

  let content = "";
  let designSvg: string | null = null;
  if (order.code_id) {
    const { data: code } = await admin
      .from("codes")
      .select("type, slug, destination_url, design_svg")
      .eq("id", order.code_id)
      .maybeSingle();
    if (code) {
      content = qrContentFor(code);
      designSvg = (code.design_svg as string | null) ?? null;
    }
  }

  // Inner code image: the customer's exact saved design if present, otherwise a
  // clean high-error-correction render of the same content.
  let codeHref: string;
  if (designSvg) {
    codeHref = `data:image/svg+xml;utf8,${encodeURIComponent(designSvg)}`;
  } else if (content) {
    const plain = await QRCode.toString(content, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 4,
      color: { dark: "#0A2540", light: "#FFFFFF" },
      width: 760,
    });
    codeHref = `data:image/svg+xml;utf8,${encodeURIComponent(plain)}`;
  } else {
    return new Response("No code attached to this order", { status: 422 });
  }

  // Compose the decal exactly as the customer configured it (shape, background,
  // border, call to action), so the proof and the print match the order.
  const svg = composeDecalSvg(
    codeHref,
    decalFromOptions(order.options as Record<string, unknown> | null)
  );

  const filename = `print-${order.product_key}-${order.id.slice(0, 8)}.svg`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
