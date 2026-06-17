import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRedirectCode,
  isServable,
  resolveRedirectTarget,
} from "@/lib/redirect";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// Redirects must never be cached by a browser, proxy, or CDN — otherwise a
// re-pointed code could keep sending people to the old place. We use 302
// (temporary) everywhere and add no-store so nothing in the chain holds onto it.
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

// The redirect engine (local + Vercel runtime). The Cloudflare Worker in /worker
// mirrors this exact behavior. Look up the slug, log the scan, 302 to the CURRENT
// destination — so a printed code always points wherever the owner last set it.
//
// Reliability contract: a scanner must NEVER hit an error page. Every failure
// mode (missing service key, DB blip, unknown/archived code, logging failure)
// resolves to a graceful 302, not a 500.
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code: slug } = await ctx.params;
  const fallback = new URL("/", request.url);

  // Look up the destination (cached). Wrapped so a transient DB error can never
  // throw a 500 at a scanner — we fall back instead of dead-ending the visitor.
  let code;
  try {
    code = await getRedirectCode(slug);
  } catch {
    return NextResponse.redirect(fallback, { status: 302, headers: NO_STORE });
  }

  if (!isServable(code)) {
    return NextResponse.redirect(fallback, { status: 302, headers: NO_STORE });
  }

  // Best-effort scan logging. Created separately from the lookup so a logging
  // failure (or missing service key) can never block the redirect.
  try {
    const admin = createAdminClient();
    const ua = request.headers.get("user-agent") || "";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ipHash = ip
      ? createHash("sha256").update(ip).digest("hex").slice(0, 32)
      : null;

    const decode = (v: string | null) => {
      if (!v) return null;
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    };
    const country = request.headers.get("x-vercel-ip-country");
    const region = decode(request.headers.get("x-vercel-ip-country-region"));
    const city = decode(request.headers.get("x-vercel-ip-city"));

    const { data: scan } = await admin
      .from("scans")
      .insert({
        code_id: code.id,
        workspace_id: code.workspace_id,
        user_agent: ua.slice(0, 500),
        referrer: request.headers.get("referer"),
        ip_hash: ipHash,
        device_type: /mobile/i.test(ua) ? "mobile" : "desktop",
        country,
        region,
        city,
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

  const ua = request.headers.get("user-agent") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const target = resolveRedirectTarget({ code, slug, ua, appUrl });
  return NextResponse.redirect(target, { status: 302, headers: NO_STORE });
}
