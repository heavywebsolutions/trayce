import { NextResponse, type NextRequest } from "next/server";
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
    .select("url")
    .eq("id", id)
    .maybeSingle();

  if (!link?.url) return NextResponse.redirect(fallback, { status: 302 });

  try {
    await admin.rpc("increment_bio_click", { p_link_id: id });
  } catch {
    /* ignore */
  }

  const target = /^https?:\/\//i.test(link.url)
    ? link.url
    : `https://${link.url}`;
  return NextResponse.redirect(target, { status: 302 });
}
