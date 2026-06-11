import { createClient } from "@/lib/supabase/server";

// CSV export of a code's leads. RLS scopes results to the signed-in owner.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: leads } = await supabase
    .from("leads")
    .select("email, name, phone, city, region, country, created_at")
    .eq("code_id", id)
    .order("created_at", { ascending: false });

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = "email,name,phone,city,region,country,created_at";
  const rows = (leads ?? []).map((l) =>
    [l.email, l.name, l.phone, l.city, l.region, l.country, l.created_at]
      .map(esc)
      .join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${id.slice(0, 8)}.csv"`,
    },
  });
}
