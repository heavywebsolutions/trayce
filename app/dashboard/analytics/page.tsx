import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsControls } from "@/components/AnalyticsControls";
import { AnalyticsView } from "@/components/AnalyticsView";
import { Card, Badge } from "@/components/ui";
import { formatNumber, cn } from "@/lib/utils";
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

const TABS = [
  { key: "codes", label: "QR Codes", soon: false },
  { key: "bio", label: "Bio Pages", soon: false },
  { key: "revenue", label: "Revenue", soon: true },
];

const SUBTITLE: Record<string, string> = {
  codes: "Every scan across all your QR codes.",
  bio: "Views and clicks across all your bio pages.",
  revenue: "Tie scans and clicks to real sales.",
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    g?: string;
    r?: string;
    from?: string;
    to?: string;
    tab?: string;
  }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "bio" || sp.tab === "revenue" ? sp.tab : "codes";
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

  // Tab links keep the current date range.
  const hrefFor = (key: string) => {
    const p = new URLSearchParams();
    if (sp.g) p.set("g", sp.g);
    if (sp.r) p.set("r", sp.r);
    if (sp.from) p.set("from", sp.from);
    if (sp.to) p.set("to", sp.to);
    p.set("tab", key);
    return `/dashboard/analytics?${p.toString()}`;
  };

  let content: React.ReactNode = null;

  if (tab === "codes") {
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

    const stats = [
      { label: "Scans (range)", value: formatNumber(scans.length) },
      { label: "Unique scans", value: formatNumber(uniqueCount(scans)) },
      { label: "All-time scans", value: formatNumber(allTime ?? 0) },
      { label: "Active codes", value: formatNumber(activeCodes ?? 0) },
    ];

    content = (
      <>
        <AnalyticsControls />
        <AnalyticsView
          stats={stats}
          buckets={bucketize(scans, range)}
          os={osBreakdown(scans)}
          locations={locationBreakdown(scans)}
          topCodes={codeBreakdown(scans)}
        />
      </>
    );
  } else if (tab === "bio") {
    const { data: pagesData } = await supabase
      .from("bio_pages")
      .select("id, display_name, handle");
    const pages = pagesData ?? [];
    const pageIds = pages.map((p) => p.id as string);
    const nameById = new Map(
      pages.map((p) => [
        p.id as string,
        (p.display_name as string) || `@${p.handle as string}`,
      ])
    );

    if (pageIds.length === 0) {
      content = (
        <Card className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink-700">No bio pages yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
            Create a bio page and its views and clicks will show up here.
          </p>
          <Link href="/dashboard/bio" className="mt-4 inline-block">
            <span className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
              Go to bio pages
            </span>
          </Link>
        </Card>
      );
    } else {
      const [{ data: rawClicks }, { count: viewCount }, { count: subCount }] =
        await Promise.all([
          supabase
            .from("bio_events")
            .select(
              "created_at, device_type, ip_hash, user_agent, city, region, country, page_id"
            )
            .in("page_id", pageIds)
            .eq("type", "click")
            .gte("created_at", range.from.toISOString())
            .lte("created_at", range.to.toISOString())
            .order("created_at", { ascending: false })
            .limit(20000),
          supabase
            .from("bio_events")
            .select("*", { count: "exact", head: true })
            .in("page_id", pageIds)
            .eq("type", "view")
            .gte("created_at", range.from.toISOString())
            .lte("created_at", range.to.toISOString()),
          supabase
            .from("bio_subscribers")
            .select("*", { count: "exact", head: true })
            .in("page_id", pageIds),
        ]);

      const clicks: ScanLite[] = (rawClicks ?? []).map(
        (e) =>
          ({
            scanned_at: e.created_at,
            device_type: e.device_type,
            city: e.city,
            region: e.region,
            country: e.country,
            user_agent: e.user_agent,
            ip_hash: e.ip_hash,
            code_title: nameById.get(e.page_id as string) ?? "Bio page",
          }) as ScanLite
      );

      const views = viewCount ?? 0;
      const clickCount = clicks.length;
      const ctr = views > 0 ? Math.round((clickCount / views) * 100) : 0;

      const stats = [
        { label: "Views (range)", value: formatNumber(views) },
        { label: "Clicks (range)", value: formatNumber(clickCount) },
        { label: "Click rate", value: `${ctr}%` },
        { label: "Subscribers", value: formatNumber(subCount ?? 0) },
      ];

      content = (
        <>
          <AnalyticsControls />
          <AnalyticsView
            stats={stats}
            buckets={bucketize(clicks, range)}
            os={osBreakdown(clicks)}
            locations={locationBreakdown(clicks)}
            topCodes={codeBreakdown(clicks)}
            labels={{
              chartTitle: "Clicks over time",
              noun: "click",
              topTitle: "Top bio pages",
              topSubtitle: "Most clicked in range",
              locationsSubtitle: "Where clicks happen (IP-based)",
            }}
          />
        </>
      );
    }
  } else {
    content = (
      <Card className="px-6 py-14 text-center">
        <Badge tone="gray">Coming soon</Badge>
        <p className="mx-auto mt-3 max-w-md text-base font-semibold text-ink-900">
          See which codes and links actually made you money.
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
          Revenue attribution will connect your scans and clicks to real sales,
          so you can prove what your marketing earns. We are building it next.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Analytics
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">{SUBTITLE[tab]}</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-5 border-b border-ink-200">
        {TABS.map((t) => {
          const active = tab === t.key;
          if (t.soon) {
            return (
              <span
                key={t.key}
                className="flex items-center gap-1.5 border-b-2 border-transparent pb-2.5 text-sm font-medium text-ink-300"
              >
                {t.label}
                <Badge tone="gray">Soon</Badge>
              </span>
            );
          }
          return (
            <Link
              key={t.key}
              href={hrefFor(t.key)}
              className={cn(
                "border-b-2 pb-2.5 text-sm font-medium transition",
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-500 hover:text-ink-800"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {content}
    </div>
  );
}
