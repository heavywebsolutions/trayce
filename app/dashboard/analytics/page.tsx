import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsControls } from "@/components/AnalyticsControls";
import { AnalyticsView } from "@/components/AnalyticsView";
import { formatNumber } from "@/lib/utils";
import {
  resolveRange,
  bucketize,
  uniqueCount,
  osBreakdown,
  locationBreakdown,
  codeBreakdown,
  type ScanLite,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string; r?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const wsId = ws?.id ?? "";

  const [{ data: raw }, { count: allTime }, { count: activeCodes }] =
    await Promise.all([
      supabase
        .from("scans")
        .select(
          "scanned_at, device_type, city, region, country, user_agent, ip_hash, codes(title)"
        )
        .eq("workspace_id", wsId)
        .gte("scanned_at", range.from.toISOString())
        .lte("scanned_at", range.to.toISOString())
        .order("scanned_at", { ascending: false })
        .limit(20000),
      supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", wsId),
      supabase
        .from("codes")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", wsId)
        .eq("status", "active"),
    ]);

  const scans: ScanLite[] = (raw ?? []).map((s) => {
    const code = Array.isArray(s.codes) ? s.codes[0] : s.codes;
    return { ...s, code_title: code?.title ?? null } as ScanLite;
  });

  const buckets = bucketize(scans, range);
  const unique = uniqueCount(scans);

  const stats = [
    { label: "Scans (range)", value: formatNumber(scans.length) },
    { label: "Unique scans", value: formatNumber(unique) },
    { label: "All-time scans", value: formatNumber(allTime ?? 0) },
    { label: "Active codes", value: formatNumber(activeCodes ?? 0) },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Analytics
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">All codes, all activity.</p>
      </div>

      <AnalyticsControls />

      <AnalyticsView
        stats={stats}
        buckets={buckets}
        os={osBreakdown(scans)}
        locations={locationBreakdown(scans)}
        topCodes={codeBreakdown(scans)}
      />
    </div>
  );
}
