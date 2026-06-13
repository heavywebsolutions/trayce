import { createClient } from "@/lib/supabase/server";

// Workspace-wide CSV export of all leads. RLS scopes results to the owner.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: leads } = await supabase
    .from("leads")
    .select(
      "email, name, phone, city, region, country, source, created_at, codes(title, slug)"
    )
    .order("created_at", { ascending: false });

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header =
    "code,code_slug,email,name,phone,city,region,country,created_at";
  const rows = (leads ?? []).map((l) => {
    const code = Array.isArray(l.codes) ? l.codes[0] : l.codes;
    return [
      code?.title ?? l.source ?? "",
      code?.slug ?? "",
      l.email,
      l.name,
      l.phone,
      l.city,
      l.region,
      l.country,
      l.created_at,
    ]
      .map(esc)
      .join(",");
  });
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="traxxr-leads.csv"`,
    },
  });
}
