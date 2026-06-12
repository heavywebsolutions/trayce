import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Bio-link click tracker: log the click, then 302 to the destination.
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const fallback = new URL("/", request.url);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.redirect(fallback, { status: 302 });
  }

  const { data: link } = await admin
    .from("bio_links")
    .select("url, page_id, workspace_id")
    .eq("id", id)
    .maybeSingle();

  if (!link?.url) return NextResponse.redirect(fallback, { status: 302 });

  try {
    await admin.rpc("increment_bio_click", { p_link_id: id });
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
    await admin.from("bio_events").insert({
      page_id: link.page_id,
      workspace_id: link.workspace_id,
      link_id: id,
      type: "click",
      device_type: /mobile/i.test(ua) ? "mobile" : "desktop",
      ip_hash: ipHash,
      user_agent: ua.slice(0, 500),
      country: request.headers.get("x-vercel-ip-country"),
      region: decode(request.headers.get("x-vercel-ip-country-region")),
      city: decode(request.headers.get("x-vercel-ip-city")),
    });
  } catch {
    /* ignore */
  }

  const target = /^https?:\/\//i.test(link.url)
    ? link.url
    : `https://${link.url}`;
  return NextResponse.redirect(target, { status: 302 });
}
