import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import { formatLocation, deviceLabel } from "@/lib/geo";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="tabular mt-2 text-3xl font-semibold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </Card>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <li className="px-6 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="truncate text-sm text-ink-700">{label}</span>
        <span className="tabular shrink-0 text-sm font-semibold text-ink-900">
          {formatNumber(count)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-ink-100">
        <div
          className="h-1.5 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

type ScanRow = {
  scanned_at: string;
  device_type: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  user_agent: string | null;
  codes: { title: string } | { title: string }[] | null;
};

export default async function AnalyticsPage() {
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

  const since = new Date(Date.now() - WINDOW_DAYS * 86400000);
  const sinceIso = since.toISOString();

  const [{ data: scansRaw }, { count: allTime }, { count: activeCodes }] =
    await Promise.all([
      supabase
        .from("scans")
        .select("scanned_at, device_type, city, region, country, user_agent, codes(title)")
        .eq("workspace_id", ws?.id ?? "")
        .gte("scanned_at", sinceIso)
        .order("scanned_at", { ascending: false })
        .limit(10000),
      supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", ws?.id ?? ""),
      supabase
        .from("codes")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", ws?.id ?? "")
        .eq("status", "active"),
    ]);

  const scans = (scansRaw ?? []) as ScanRow[];

  // --- daily buckets (UTC) ---
  const dayKeys: string[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    dayKeys.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  const dayCounts = new Map<string, number>(dayKeys.map((k) => [k, 0]));
  for (const s of scans) {
    const k = s.scanned_at.slice(0, 10);
    if (dayCounts.has(k)) dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
  }
  const maxDay = Math.max(1, ...dayKeys.map((k) => dayCounts.get(k) ?? 0));
  const busiest = dayKeys.reduce(
    (best, k) =>
      (dayCounts.get(k) ?? 0) > best.count
        ? { day: k, count: dayCounts.get(k) ?? 0 }
        : best,
    { day: "", count: 0 }
  );

  // --- device + OS ---
  let mobile = 0;
  let desktop = 0;
  const osCounts = new Map<string, number>();
  const locCounts = new Map<string, number>();
  const codeCounts = new Map<string, number>();
  for (const s of scans) {
    if (s.device_type === "mobile") mobile++;
    else desktop++;
    const os = deviceLabel(s.user_agent);
    osCounts.set(os, (osCounts.get(os) ?? 0) + 1);
    const loc = formatLocation(s);
    locCounts.set(loc, (locCounts.get(loc) ?? 0) + 1);
    const code = Array.isArray(s.codes) ? s.codes[0] : s.codes;
    const title = code?.title ?? "Unknown";
    codeCounts.set(title, (codeCounts.get(title) ?? 0) + 1);
  }

  const topLocations = [...locCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topCodes = [...codeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const deviceMax = Math.max(1, mobile, desktop);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Analytics
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Last {WINDOW_DAYS} days across all your codes.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={`Scans (${WINDOW_DAYS}d)`} value={formatNumber(scans.length)} />
        <StatCard label="All-time scans" value={formatNumber(allTime ?? 0)} />
        <StatCard label="Active codes" value={formatNumber(activeCodes ?? 0)} />
        <StatCard
          label="Busiest day"
          value={busiest.count > 0 ? formatNumber(busiest.count) : "—"}
          hint={busiest.count > 0 ? busiest.day : "No scans yet"}
        />
      </div>

      {/* Scans over time */}
      <Card className="mb-5 p-6">
        <h2 className="text-base font-semibold text-ink-900">Scans over time</h2>
        <p className="mb-4 mt-0.5 text-sm text-ink-500">
          Daily scans, last {WINDOW_DAYS} days.
        </p>
        <div className="flex h-40 items-end gap-1">
          {dayKeys.map((k) => {
            const count = dayCounts.get(k) ?? 0;
            const h = Math.round((count / maxDay) * 100);
            return (
              <div
                key={k}
                title={`${k}: ${count} scan${count === 1 ? "" : "s"}`}
                className="flex-1 rounded-t bg-accent/80 transition hover:bg-accent"
                style={{ height: `${Math.max(count > 0 ? 6 : 2, h)}%` }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ink-400">
          <span>{dayKeys[0]}</span>
          <span>{dayKeys[dayKeys.length - 1]}</span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Device split */}
        <Card>
          <CardHeader title="Device" subtitle="How people scan" />
          <ul>
            <BarRow label="Mobile" count={mobile} max={deviceMax} />
            <BarRow label="Desktop" count={desktop} max={deviceMax} />
          </ul>
          {osCounts.size > 0 && (
            <div className="border-t border-ink-100 px-6 py-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-400">
                By OS
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...osCounts.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([os, n]) => (
                    <span
                      key={os}
                      className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-xs text-ink-600"
                    >
                      {os} · {n}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </Card>

        {/* Top codes */}
        <Card>
          <CardHeader title="Top codes" subtitle="Most scanned" />
          {topCodes.length > 0 ? (
            <ul className="divide-y divide-ink-50">
              {topCodes.map(([title, n]) => (
                <BarRow key={title} label={title} count={n} max={topCodes[0][1]} />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-ink-500">
              No scans in this window yet.
            </p>
          )}
        </Card>

        {/* Top locations */}
        <Card className="lg:col-span-2">
          <CardHeader title="Top locations" subtitle="Where scans happen (IP-based)" />
          {topLocations.length > 0 ? (
            <ul className="divide-y divide-ink-50">
              {topLocations.map(([loc, n]) => (
                <BarRow key={loc} label={loc} count={n} max={topLocations[0][1]} />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-ink-500">
              No location data yet.
            </p>
          )}
        </Card>
      </div>

      <p className="mt-4 text-center text-xs text-ink-400">
        Showing up to 10,000 scans in the window. Location is IP-based and
        approximate.
      </p>
    </div>
  );
}
