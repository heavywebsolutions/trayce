import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsControls } from "@/components/AnalyticsControls";
import { AnalyticsView } from "@/components/AnalyticsView";
import { Badge } from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import {
  resolveRange,
  bucketize,
  uniqueCount,
  osBreakdown,
  locationBreakdown,
  type ScanLite,
} from "@/lib/analytics";
import { loadEntitlements } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function CodeAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ g?: string; r?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const range = resolveRange(sp);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: code } = await supabase
    .from("codes")
    .select("id, title, slug, status, scan_count")
    .eq("id", id)
    .maybeSingle();
  if (!code) notFound();

  const { data: raw } = await supabase
    .from("scans")
    .select(
      "scanned_at, device_type, city, region, country, user_agent, ip_hash"
    )
    .eq("code_id", code.id)
    .gte("scanned_at", range.from.toISOString())
    .lte("scanned_at", range.to.toISOString())
    .order("scanned_at", { ascending: false })
    .limit(20000);

  const scans: ScanLite[] = (raw ?? []).map(
    (s) => ({ ...s, code_title: code.title }) as ScanLite
  );

  const gate = await loadEntitlements();
  const locked = gate ? !gate.ent.analyticsHistory : false;

  const buckets = bucketize(scans, range);
  const unique = uniqueCount(scans);

  const stats = [
    { label: "Scans (range)", value: formatNumber(scans.length) },
    { label: "Unique scans", value: formatNumber(unique) },
    { label: "All-time scans", value: formatNumber(code.scan_count ?? 0) },
    { label: "Status", value: code.status },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/dashboard/codes/${code.id}`}
        className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-700"
      >
        ← Back to code
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {code.title}
        </h1>
        <Badge tone="gray">/{code.slug}</Badge>
      </div>

      {!locked && <AnalyticsControls />}

      <AnalyticsView
        stats={stats}
        buckets={buckets}
        os={osBreakdown(scans)}
        locations={locationBreakdown(scans)}
        locked={locked}
      />
    </div>
  );
}
