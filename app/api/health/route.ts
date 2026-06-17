import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Health probe for external uptime monitors (UptimeRobot, Better Uptime, etc.).
// Point a monitor at /api/health every few minutes: a 200 means the app can
// reach the database (so the redirect engine can serve codes); a 503 means it
// cannot, and you should be alerted before customers notice.
//
// Optionally pass ?slug=<a-known-live-code> to also assert that a real code
// still resolves to a non-fallback destination — the closest thing to a true
// end-to-end "are my QR codes working" check.
export async function GET(request: NextRequest) {
  const started = Date.now();
  const slug = request.nextUrl.searchParams.get("slug");

  try {
    const admin = createAdminClient();

    // 1) Database reachable? Cheap head-count, no data returned.
    const { error: dbError } = await admin
      .from("codes")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (dbError) throw new Error("db");

    // 2) Optional: a specific known code still resolves with a destination.
    let codeOk: boolean | undefined;
    if (slug) {
      const { data: code } = await admin
        .from("codes")
        .select("id, destination_url, status")
        .eq("slug", slug)
        .maybeSingle();
      codeOk = Boolean(
        code && code.status !== "archived" && code.destination_url
      );
      if (!codeOk) throw new Error("code");
    }

    return NextResponse.json(
      {
        ok: true,
        db: true,
        ...(slug ? { code: codeOk } : {}),
        ms: Date.now() - started,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const reason = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { ok: false, reason, ms: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
