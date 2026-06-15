import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";
import { formatNumber, timeAgo } from "@/lib/utils";
import { formatLocation, deviceLabel } from "@/lib/geo";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function trendOf(cur: number, prev: number): { p: number; up: boolean } | null {
  if (prev <= 0) return null;
  const p = Math.round(((cur - prev) / prev) * 100);
  return { p, up: p >= 0 };
}

function Kpi({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { p: number; up: boolean } | null;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <p className="tabular text-3xl font-semibold text-ink-900">{value}</p>
        {trend && (
          <span
            className={`mb-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              trend.up
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {trend.up ? "↑" : "↓"} {Math.abs(trend.p)}%
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
    </Card>
  );
}

function path(vals: number[], maxY: number, w: number, h: number, pad: number, area: boolean) {
  const n = vals.length;
  if (n === 0) return "";
  const stepX = n > 1 ? w / (n - 1) : 0;
  const y = (v: number) => h - pad - (maxY > 0 ? (v / maxY) * (h - pad * 2) : 0);
  let d = vals
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  if (area) d += ` L${w},${h} L0,${h} Z`;
  return d;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("owner_id", user?.id ?? "")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  const wsId = ws?.id ?? "";

  const now = Date.now();
  const d7 = new Date(now - 7 * DAY).toISOString();
  const d14 = new Date(now - 14 * DAY).toISOString();

  const [
    scansRes,
    bioRes,
    leadsRes,
    leadsTotalRes,
    activeCodesRes,
    topCodesRes,
    topPagesRes,
    recentRes,
  ] = await Promise.all([
    supabase
      .from("scans")
      .select("scanned_at")
      .eq("workspace_id", wsId)
      .gte("scanned_at", d14)
      .limit(20000),
    supabase
      .from("bio_events")
      .select("created_at, type, bio_links(title)")
      .eq("workspace_id", wsId)
      .gte("created_at", d14)
      .limit(20000),
    supabase
      .from("leads")
      .select("created_at")
      .eq("workspace_id", wsId)
      .gte("created_at", d14)
      .limit(20000),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", wsId),
    supabase
      .from("codes")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", wsId)
      .eq("status", "active"),
    supabase
      .from("codes")
      .select("id, title, slug, scan_count")
      .eq("workspace_id", wsId)
      .neq("status", "archived")
      .order("scan_count", { ascending: false })
      .limit(5),
    supabase
      .from("bio_pages")
      .select("id, display_name, handle, views")
      .eq("workspace_id", wsId)
      .order("views", { ascending: false })
      .limit(5),
    supabase
      .from("scans")
      .select(
        "id, scanned_at, device_type, user_agent, city, region, country, codes(title, slug, destination_url)"
      )
      .eq("workspace_id", wsId)
      .order("scanned_at", { ascending: false })
      .limit(6),
  ]);

  const scanRows = scansRes.data ?? [];
  const clickRows = (bioRes.data ?? []).filter((r) => r.type === "click");
  const leadRows = leadsRes.data ?? [];
  const cut7 = now - 7 * DAY;
  const in7 = (iso: string) => new Date(iso).getTime() >= cut7;

  const scans7 = scanRows.filter((r) => in7(r.scanned_at)).length;
  const clicks7 = clickRows.filter((r) => in7(r.created_at)).length;
  const leads7 = leadRows.filter((r) => in7(r.created_at)).length;
  const scansTrend = trendOf(scans7, scanRows.length - scans7);
  const clicksTrend = trendOf(clicks7, clickRows.length - clicks7);
  const leadsTrend = trendOf(leads7, leadRows.length - leads7);

  // 14-day daily buckets (index 13 = today)
  const idx = (iso: string) => {
    const diff = Math.floor((now - new Date(iso).getTime()) / DAY);
    return diff >= 0 && diff < 14 ? 13 - diff : -1;
  };
  const scanSeries = Array(14).fill(0) as number[];
  const clickSeries = Array(14).fill(0) as number[];
  for (const r of scanRows) {
    const i = idx(r.scanned_at);
    if (i >= 0) scanSeries[i]++;
  }
  for (const r of clickRows) {
    const i = idx(r.created_at);
    if (i >= 0) clickSeries[i]++;
  }
  const maxY = Math.max(1, ...scanSeries, ...clickSeries);
  const W = 560;
  const H = 150;
  const PAD = 14;

  const topCodes = topCodesRes.data ?? [];
  const topPages = topPagesRes.data ?? [];

  // Most-clicked bio links across all pages (last 14 days).
  const linkCounts = new Map<string, number>();
  for (const r of clickRows) {
    const link = Array.isArray(r.bio_links) ? r.bio_links[0] : r.bio_links;
    const title = (link as { title?: string } | null)?.title;
    if (title) linkCounts.set(title, (linkCounts.get(title) ?? 0) + 1);
  }
  const topLinks = [...linkCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const recent = recentRes.data ?? [];
  const hasCodes = topCodes.length > 0;
  const totalLeads = leadsTotalRes.count ?? 0;
  const activeCodes = activeCodesRes.count ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">
            {ws?.name ? `${ws.name} ` : ""}at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/bio">
            <Button variant="secondary">New bio page</Button>
          </Link>
          <Link href="/dashboard/codes">
            <Button>Create a code</Button>
          </Link>
        </div>
      </div>

      {/* First-run nudge */}
      {!hasCodes && (
        <div className="mb-5 rounded-2xl border-2 border-accent-ring bg-accent-soft p-6">
          <h2 className="text-base font-semibold text-ink-900">
            Welcome to Traxxr.
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Three steps to your first tracked scan:
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-ink-600">
            <li>1. Create a code, or build a link-in-bio page.</li>
            <li>2. Print it on something, or drop it in your social bio.</li>
            <li>3. Watch scans, clicks, and leads land here in real time.</li>
          </ol>
          <Link href="/dashboard/codes" className="mt-4 inline-block">
            <Button>Create your first code</Button>
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Scans"
          value={formatNumber(scans7)}
          sub="last 7 days"
          trend={scansTrend}
        />
        <Kpi
          label="Bio clicks"
          value={formatNumber(clicks7)}
          sub="last 7 days"
          trend={clicksTrend}
        />
        <Kpi
          label="Leads"
          value={formatNumber(leads7)}
          sub={`${formatNumber(totalLeads)} all time`}
          trend={leadsTrend}
        />
        <Kpi label="Active codes" value={formatNumber(activeCodes)} sub="live now" />
      </div>

      {/* Activity chart */}
      <Card className="mb-5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Activity</h2>
            <p className="text-xs text-ink-400">Last 14 days</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" /> Scans
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Bio clicks
            </span>
          </div>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-40 w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="scanfill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2587DE" stopOpacity="0.22" />
              <stop offset="1" stopColor="#2587DE" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={path(scanSeries, maxY, W, H, PAD, true)} fill="url(#scanfill)" />
          <path
            d={path(scanSeries, maxY, W, H, PAD, false)}
            fill="none"
            stroke="#2587DE"
            strokeWidth="2.5"
          />
          <path
            d={path(clickSeries, maxY, W, H, PAD, false)}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
          />
        </svg>
      </Card>

      {/* Top performers */}
      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
            <h2 className="text-base font-semibold text-ink-900">Top codes</h2>
            <Link
              href="/dashboard/codes"
              className="text-xs font-medium text-accent hover:underline"
            >
              All codes
            </Link>
          </div>
          {topCodes.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {topCodes.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 px-6 py-3"
                >
                  <Link
                    href={`/dashboard/codes/${c.id}`}
                    className="min-w-0 truncate text-sm font-medium text-ink-800 hover:text-ink-900"
                  >
                    {c.title}
                  </Link>
                  <span className="tabular shrink-0 text-sm font-semibold text-ink-900">
                    {formatNumber(c.scan_count)}
                    <span className="ml-1 text-xs font-normal text-ink-400">
                      scans
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-ink-500">
              No codes yet.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
            <h2 className="text-base font-semibold text-ink-900">Top bio pages</h2>
            <Link
              href="/dashboard/bio"
              className="text-xs font-medium text-accent hover:underline"
            >
              All pages
            </Link>
          </div>
          {topPages.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {topPages.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 px-6 py-3"
                >
                  <Link
                    href={`/dashboard/bio/${p.id}`}
                    className="min-w-0 truncate text-sm font-medium text-ink-800 hover:text-ink-900"
                  >
                    {p.display_name || `@${p.handle}`}
                  </Link>
                  <span className="tabular shrink-0 text-sm font-semibold text-ink-900">
                    {formatNumber(p.views)}
                    <span className="ml-1 text-xs font-normal text-ink-400">
                      views
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-ink-500">
              No bio pages yet.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
            <h2 className="text-base font-semibold text-ink-900">Top links</h2>
            <Link
              href="/dashboard/analytics?tab=bio"
              className="text-xs font-medium text-accent hover:underline"
            >
              Bio analytics
            </Link>
          </div>
          {topLinks.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {topLinks.map(([title, count]) => (
                <li
                  key={title}
                  className="flex items-center justify-between gap-4 px-6 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-ink-800">
                    {title}
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold text-ink-900">
                    {formatNumber(count)}
                    <span className="ml-1 text-xs font-normal text-ink-400">
                      clicks
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-ink-500">
              No link clicks yet.
            </p>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink-900">
              Recent activity
            </h2>
            <p className="text-xs text-ink-400">Live scans across all codes</p>
          </div>
          <Link
            href="/dashboard/analytics"
            className="text-xs font-medium text-accent hover:underline"
          >
            Analytics
          </Link>
        </div>
        {recent.length > 0 ? (
          <ul className="divide-y divide-ink-100">
            {recent.map((s) => {
              const code = Array.isArray(s.codes) ? s.codes[0] : s.codes;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-6 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-800">
                      {code?.title ?? "Code"}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      /{code?.slug} → {code?.destination_url}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={s.device_type === "mobile" ? "indigo" : "gray"}>
                        {deviceLabel(s.user_agent)}
                      </Badge>
                      <span className="tabular text-xs text-ink-400">
                        {timeAgo(s.scanned_at)}
                      </span>
                    </div>
                    <span className="text-xs text-ink-400">
                      {formatLocation(s)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-ink-700">No scans yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
              Create a code, print it on something, and every scan shows up here
              in real time.
            </p>
            <Link href="/dashboard/codes" className="mt-4 inline-block">
              <Button variant="secondary">Create your first code</Button>
            </Link>
          </div>
        )}
      </Card>

      <p className="mt-4 text-center text-xs text-ink-400">
        Revenue attribution is coming soon. See it first in{" "}
        <Link
          href="/dashboard/analytics?tab=revenue"
          className="font-medium text-accent hover:underline"
        >
          Analytics → Revenue
        </Link>
        .
      </p>
    </div>
  );
}
