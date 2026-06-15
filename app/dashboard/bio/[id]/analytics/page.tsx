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
  osBreakdown,
  locationBreakdown,
  codeBreakdown,
  type ScanLite,
} from "@/lib/analytics";
import { loadEntitlements } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function BioAnalyticsPage({
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

  const { data: page } = await supabase
    .from("bio_pages")
    .select("id, display_name, handle")
    .eq("id", id)
    .maybeSingle();
  if (!page) notFound();

  const [{ data: rawClicks }, { count: viewCount }, { count: subCount }] =
    await Promise.all([
      supabase
        .from("bio_events")
        .select(
          "created_at, device_type, ip_hash, user_agent, city, region, country, bio_links(title)"
        )
        .eq("page_id", id)
        .eq("type", "click")
        .gte("created_at", range.from.toISOString())
        .lte("created_at", range.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(20000),
      supabase
        .from("bio_events")
        .select("*", { count: "exact", head: true })
        .eq("page_id", id)
        .eq("type", "view")
        .gte("created_at", range.from.toISOString())
        .lte("created_at", range.to.toISOString()),
      supabase
        .from("bio_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("page_id", id),
    ]);

  const clicks: ScanLite[] = (rawClicks ?? []).map((e) => {
    const link = Array.isArray(e.bio_links) ? e.bio_links[0] : e.bio_links;
    return {
      scanned_at: e.created_at,
      device_type: e.device_type,
      city: e.city,
      region: e.region,
      country: e.country,
      user_agent: e.user_agent,
      ip_hash: e.ip_hash,
      code_title: link?.title ?? "Link",
    } as ScanLite;
  });

  const gate = await loadEntitlements();
  const locked = gate ? !gate.ent.analyticsHistory : false;

  const buckets = bucketize(clicks, range);
  const views = viewCount ?? 0;
  const clickCount = clicks.length;
  const ctr = views > 0 ? Math.round((clickCount / views) * 100) : 0;

  const stats = [
    { label: "Views (range)", value: formatNumber(views) },
    { label: "Clicks (range)", value: formatNumber(clickCount) },
    { label: "Click rate", value: `${ctr}%` },
    { label: "Subscribers", value: formatNumber(subCount ?? 0) },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/dashboard/bio/${page.id}`}
        className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-700"
      >
        ← Back to page
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {page.display_name || page.handle}
        </h1>
        <Badge tone="gray">@{page.handle}</Badge>
      </div>

      {!locked && <AnalyticsControls />}

      <AnalyticsView
        stats={stats}
        buckets={buckets}
        os={osBreakdown(clicks)}
        locations={locationBreakdown(clicks)}
        topCodes={codeBreakdown(clicks)}
        locked={locked}
        labels={{
          chartTitle: "Clicks over time",
          noun: "click",
          topTitle: "Top links",
          topSubtitle: "Most clicked in range",
          locationsSubtitle: "Where clicks happen (IP-based)",
        }}
      />
    </div>
  );
}
