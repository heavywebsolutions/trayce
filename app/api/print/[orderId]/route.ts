import QRCode from "qrcode";
import { qrContentFor } from "@/lib/qr";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { getPrintProduct } from "@/lib/print/catalog";

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
  if (order.code_id) {
    const { data: code } = await admin
      .from("codes")
      .select("type, slug, destination_url")
      .eq("id", order.code_id)
      .maybeSingle();
    if (code) content = qrContentFor(code);
  }
  if (!content) {
    return new Response("No code attached to this order", { status: 422 });
  }

  const product = getPrintProduct(order.product_key);
  const sizeKey = (order.options as { size?: string } | null)?.size;
  const size = product?.sizes.find((s) => s.key === sizeKey);
  const widthIn = size?.widthIn ?? 4;
  const px = Math.round(widthIn * 300); // 300 DPI reference size

  const svg = await QRCode.toString(content, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 4, // full quiet zone per the QR spec, important for print
    color: { dark: "#0A2540", light: "#FFFFFF" },
    width: px,
  });

  const filename = `print-${order.product_key}-${sizeKey ?? "size"}-${order.id.slice(0, 8)}.svg`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
