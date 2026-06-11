import { createClient } from "@/lib/supabase/server";

// CSV export of a bio page's email subscribers. RLS scopes to the owner.
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

  const { data: subs } = await supabase
    .from("bio_subscribers")
    .select("email, city, region, country, created_at")
    .eq("page_id", id)
    .order("created_at", { ascending: false });

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = "email,city,region,country,created_at";
  const rows = (subs ?? []).map((s) =>
    [s.email, s.city, s.region, s.country, s.created_at].map(esc).join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${id.slice(0, 8)}.csv"`,
    },
  });
}
