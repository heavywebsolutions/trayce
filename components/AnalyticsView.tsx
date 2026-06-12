import { Card, CardHeader } from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import type { Bucket } from "@/lib/analytics";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="tabular mt-2 text-3xl font-semibold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </Card>
  );
}

function BarList({
  rows,
  emptyText,
}: {
  rows: [string, number][];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-ink-500">{emptyText}</p>
    );
  }
  const max = rows[0][1] || 1;
  const total = rows.reduce((s, r) => s + r[1], 0) || 1;
  return (
    <ul className="divide-y divide-ink-50">
      {rows.map(([label, count]) => (
        <li key={label} className="px-6 py-2.5">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="truncate text-sm text-ink-700">{label}</span>
            <span className="tabular shrink-0 text-sm text-ink-500">
              <span className="font-semibold text-ink-900">
                {formatNumber(count)}
              </span>{" "}
              · {Math.round((count / total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-ink-100">
            <div
              className="h-1.5 rounded-full bg-accent"
              style={{ width: `${Math.max(4, Math.round((count / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsView({
  stats,
  buckets,
  os,
  locations,
  topCodes,
  labels,
}: {
  stats: { label: string; value: string; hint?: string }[];
  buckets: Bucket[];
  os: [string, number][];
  locations: [string, number][];
  topCodes?: [string, number][];
  labels?: {
    chartTitle?: string;
    noun?: string;
    topTitle?: string;
    topSubtitle?: string;
    locationsSubtitle?: string;
  };
}) {
  const maxTotal = Math.max(1, ...buckets.map((b) => b.total));
  const L = labels ?? {};
  const noun = L.noun ?? "scan";
  const empty = `No ${noun}s in this range yet.`;

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Scans over time: total vs unique */}
      <Card className="mb-5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">
            {L.chartTitle ?? "Scans over time"}
          </h2>
          <div className="flex items-center gap-3 text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent/30" /> Total
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Unique
            </span>
          </div>
        </div>
        <div className="flex h-44 items-end gap-1">
          {buckets.map((b) => (
            <div
              key={b.key}
              title={`${b.label}: ${b.total} ${noun}${b.total === 1 ? "" : "s"} · ${b.unique} unique`}
              className="relative h-full flex-1"
            >
              <div
                className="absolute bottom-0 w-full rounded-t bg-accent/30"
                style={{
                  height: `${Math.max(b.total > 0 ? 4 : 0, Math.round((b.total / maxTotal) * 100))}%`,
                }}
              />
              <div
                className="absolute bottom-0 w-full rounded-t bg-accent"
                style={{
                  height: `${Math.max(b.unique > 0 ? 4 : 0, Math.round((b.unique / maxTotal) * 100))}%`,
                }}
              />
            </div>
          ))}
        </div>
        {buckets.length > 0 && (
          <div className="mt-2 flex justify-between text-[11px] text-ink-400">
            <span>{buckets[0].label}</span>
            <span>{buckets[buckets.length - 1].label}</span>
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Operating system" subtitle={`Of all ${noun}s`} />
          <BarList rows={os} emptyText={empty} />
        </Card>

        <Card>
          <CardHeader
            title="Top locations"
            subtitle={L.locationsSubtitle ?? "Where scans happen (IP-based)"}
          />
          <BarList rows={locations} emptyText="No location data yet." />
        </Card>
      </div>

      {topCodes && (
        <Card className="mt-5">
          <CardHeader
            title={L.topTitle ?? "Top codes"}
            subtitle={L.topSubtitle ?? "Most scanned in range"}
          />
          <BarList rows={topCodes} emptyText={empty} />
        </Card>
      )}
    </>
  );
}
