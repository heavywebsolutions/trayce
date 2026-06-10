import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// The redirect engine (local + Vercel runtime). The Cloudflare Worker in /worker
// mirrors this exact behavior. Look up the slug, log the scan, 302 to the CURRENT
// destination — so a printed code always points wherever the owner last set it.
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code: slug } = await ctx.params;
  const fallback = new URL("/", request.url);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // Service role not configured — still redirect so a printed code never dead-ends.
    return NextResponse.redirect(fallback, { status: 302 });
  }

  const { data: code } = await admin
    .from("codes")
    .select("id, workspace_id, destination_url, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!code || code.status === "archived") {
    return NextResponse.redirect(fallback, { status: 302 });
  }

  const ua = request.headers.get("user-agent") || "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const ipHash = ip
    ? createHash("sha256").update(ip).digest("hex").slice(0, 32)
    : null;

  // Log the scan + bump the counter. Awaited so serverless doesn't kill it mid-flight.
  try {
    const { data: scan } = await admin
      .from("scans")
      .insert({
        code_id: code.id,
        workspace_id: code.workspace_id,
        user_agent: ua.slice(0, 500),
        referrer: request.headers.get("referer"),
        ip_hash: ipHash,
        device_type: /mobile/i.test(ua) ? "mobile" : "desktop",
        country: request.headers.get("x-vercel-ip-country"),
      })
      .select("id")
      .single();

    await admin.rpc("increment_scan", { p_code_id: code.id });

    if (scan?.id) {
      await admin.from("attribution_events").insert({
        workspace_id: code.workspace_id,
        scan_id: scan.id,
        code_id: code.id,
        event_type: "scan",
        source: "redirect",
      });
    }
  } catch {
    // Never let logging failures block a customer's scan.
  }

  return NextResponse.redirect(code.destination_url, { status: 302 });
}
