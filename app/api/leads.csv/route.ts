import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveLeadRange, unifyLeads } from "@/lib/leads";

// Workspace-wide CSV export of all leads, unified across QR codes and bio
// pages. Honors the same range + source filters as the Leads page so the export
// matches what the user is looking at. RLS scopes results to the owner.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const params = request.nextUrl.searchParams;
  const range = resolveLeadRange(params.get("r"));
  const srcParam = params.get("src");
  const src = srcParam === "qr" || srcParam === "bio" ? srcParam : "all";
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const [{ data: leadRows }, { data: subRows }, { data: pageRows }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          "email, name, phone, city, region, country, source, created_at, code_id, page_id, codes(title)"
        )
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: false })
        .limit(50000),
      supabase
        .from("bio_subscribers")
        .select("email, city, region, country, created_at, page_id")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: false })
        .limit(50000),
      supabase.from("bio_pages").select("id, display_name, handle"),
    ]);

  const pageName = new Map<string, string>();
  for (const p of pageRows ?? []) {
    pageName.set(
      p.id as string,
      (p.display_name as string) || `@${p.handle as string}`
    );
  }

  const rows = unifyLeads({
    leads: leadRows ?? [],
    subscribers: subRows ?? [],
    pageName,
  }).filter((l) => (src === "all" ? true : l.sourceType === src));

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header =
    "source_type,source,detail,email,name,phone,city,region,country,created_at";
  const body = rows.map((l) =>
    [
      l.sourceType === "qr" ? "QR code" : "Bio page",
      l.sourceLabel,
      l.sourceDetail ?? "",
      l.email,
      l.name,
      l.phone,
      l.city,
      l.region,
      l.country,
      l.created_at,
    ]
      .map(esc)
      .join(",")
  );
  const csv = [header, ...body].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="traxxr-leads.csv"`,
    },
  });
}
