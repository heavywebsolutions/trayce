import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUrl } from "@/lib/utils";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// Booking tap engine. Mirrors the QR redirect engine (/r/[code]): look up the
// placement, log the tap, then 302 to the business's booker — or to the capture
// interstitial first when lead capture is on. A visitor must NEVER hit an error
// page: every failure mode resolves to a graceful 302, never a 500.
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

type LinkLite = {
  destination_url: string;
  capture_lead: boolean;
  status: string;
};

type PlacementRow = {
  id: string;
  booking_link_id: string;
  workspace_id: string;
  status: string;
  booking_links: LinkLite | LinkLite[] | null;
};

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const fallback = new URL("/", request.url);

  let placement: PlacementRow | null = null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("booking_placements")
      .select(
        "id, booking_link_id, workspace_id, status, booking_links(destination_url, capture_lead, status)"
      )
      .eq("slug", slug)
      .maybeSingle();
    placement = data as unknown as PlacementRow | null;
  } catch {
    return NextResponse.redirect(fallback, { status: 302, headers: NO_STORE });
  }

  const link = Array.isArray(placement?.booking_links)
    ? placement?.booking_links[0]
    : placement?.booking_links;

  // Servable unless missing or archived (placement or parent link).
  if (
    !placement ||
    placement.status === "archived" ||
    !link ||
    link.status === "archived"
  ) {
    return NextResponse.redirect(fallback, { status: 302, headers: NO_STORE });
  }

  // Best-effort tap logging. Never blocks the redirect.
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

    await admin.from("booking_taps").insert({
      placement_id: placement.id,
      booking_link_id: placement.booking_link_id,
      workspace_id: placement.workspace_id,
      user_agent: ua.slice(0, 500),
      referrer: request.headers.get("referer"),
      ip_hash: ipHash,
      device_type: /mobile/i.test(ua) ? "mobile" : "desktop",
      country: request.headers.get("x-vercel-ip-country"),
      region: decode(request.headers.get("x-vercel-ip-country-region")),
      city: decode(request.headers.get("x-vercel-ip-city")),
    });
    await admin.rpc("increment_booking_tap", {
      p_placement_id: placement.id,
      p_booking_link_id: placement.booking_link_id,
    });
  } catch {
    // Never let logging failures block a booking.
  }

  // Capture on: send to the interstitial (it forwards to the booker on submit).
  if (link.capture_lead) {
    return NextResponse.redirect(new URL(`/book/${slug}`, request.url), {
      status: 302,
      headers: NO_STORE,
    });
  }

  // Capture off: straight to the booker.
  return NextResponse.redirect(normalizeUrl(link.destination_url), {
    status: 302,
    headers: NO_STORE,
  });
}
