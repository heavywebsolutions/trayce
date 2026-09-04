import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
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
//
// Performance: scan logging runs inside after() so the visitor is redirected
// as soon as we know the destination. The three log writes (scans insert,
// increment_scan RPC, attribution_events insert) continue on Vercel's runtime
// AFTER the response is sent. This mirrors the Cloudflare Worker's waitUntil()
// pattern and drops the visitor-visible latency from 4 sequential Supabase
// round trips down to 1.
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code: slug } = await ctx.params;
  const fallback = new URL("/", request.url);

  // Look up the destination. Wrapped so a transient DB error can never
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

  // Compute the redirect target BEFORE queuing background work so the response
  // can go out immediately.
  const ua = request.headers.get("user-agent") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const target = resolveRedirectTarget({ code, slug, ua, appUrl });

  // Capture request headers we need in the background handler. Read them here
  // because request/headers may not be available once the response is streamed.
  const referrer = request.headers.get("referer");
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const country = request.headers.get("x-vercel-ip-country");
  const regionRaw = request.headers.get("x-vercel-ip-country-region");
  const cityRaw = request.headers.get("x-vercel-ip-city");

  // Best-effort scan logging, moved to after() so it never blocks the redirect.
  // The visitor receives the 302 as soon as we return; the three DB writes
  // continue in the background. A logging failure has zero visitor impact.
  after(async () => {
    try {
      const admin = createAdminClient();
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
      const region = decode(regionRaw);
      const city = decode(cityRaw);

      const { data: scan } = await admin
        .from("scans")
        .insert({
          code_id: code.id,
          workspace_id: code.workspace_id,
          user_agent: ua.slice(0, 500),
          referrer,
          ip_hash: ipHash,
          device_type: /mobile/i.test(ua) ? "mobile" : "desktop",
          country,
          region,
          city,
        })
        .select("id")
        .single();

      // increment_scan and attribution_events are independent of each other,
      // so fire them in parallel to keep total background work short.
      await Promise.all([
        admin.rpc("increment_scan", { p_code_id: code.id }),
        scan?.id
          ? admin.from("attribution_events").insert({
              workspace_id: code.workspace_id,
              scan_id: scan.id,
              code_id: code.id,
              event_type: "scan",
              source: "redirect",
            })
          : Promise.resolve(),
      ]);
    } catch {
      // Never let logging failures matter — the visitor is already redirected.
    }
  });

  return NextResponse.redirect(target, { status: 302, headers: NO_STORE });
}
