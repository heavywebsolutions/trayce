import Link from "next/link";
import { Card, CardHeader } from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import type { Bucket } from "@/lib/analytics";

function LockedTeaser({ noun }: { noun: string }) {
  return (
    <Card className="px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink-900">
        See where these {noun}s came from
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
        Location, device, trends over time, and custom date ranges are part of
        the paid plans. Your totals above stay free, always.
      </p>
      <Link
        href="/dashboard/settings?upgrade=analytics"
        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover"
      >
        Unlock full analytics
      </Link>
    </Card>
  );
}

// Compact secondary metric — tight, dense, lets the hero carry the weight.
function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-3.5 sm:p-4">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold text-ink-900 sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-0.5 truncate text-[11px] text-ink-400">{hint}</p>}
    </Card>
  );
}

// Momentum within the selected range: recent half vs earlier half. Honest
// directional signal without needing a separate previous-period query.
function trendDelta(buckets: Bucket[]): number | null {
  if (buckets.length < 4) return null;
  const mid = Math.floor(buckets.length / 2);
  const first = buckets.slice(0, mid).reduce((s, b) => s + b.total, 0);
  const second = buckets.slice(mid).reduce((s, b) => s + b.total, 0);
  if (first === 0) return second > 0 ? 100 : null;
  return Math.round(((second - first) / first) * 100);
}

// Smooth-ish area + line chart driven by the same buckets the bars used.
// non-scaling-stroke keeps the line crisp while the SVG stretches to full width.
function TrendChart({
  buckets,
  maxTotal,
  noun,
}: {
  buckets: Bucket[];
  maxTotal: number;
  noun: string;
}) {
  const n = buckets.length;
  const W = 300;
  const H = 84;
  const pad = 4;
  const xy = (i: number, val: number): [number, number] => {
    const x = n === 1 ? W / 2 : (i / (n - 1)) * W;
    const y = H - pad - (val / maxTotal) * (H - pad * 2);
    return [x, y];
  };
  const path = (key: "total" | "unique") =>
    buckets
      .map((b, i) => {
        const [x, y] = xy(i, b[key]);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  const totalLine = path("total");
  const area = `${totalLine} L${W} ${H} L0 ${H} Z`;
  const [lx, ly] = xy(n - 1, buckets[n - 1].total);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="84"
      preserveAspectRatio="none"
      className="mt-4 block overflow-visible"
      role="img"
      aria-label={`${noun} trend over time`}
    >
      <path d={area} fill="rgb(37 135 222 / 0.10)" stroke="none" />
      <path
        d={path("unique")}
        fill="none"
        stroke="rgb(37 135 222 / 0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={totalLine}
        fill="none"
        stroke="#2587DE"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r="3.5" fill="#2587DE" vectorEffect="non-scaling-stroke" />
    </svg>
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
  locked,
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
  locked?: boolean;
}) {
  const maxTotal = Math.max(1, ...buckets.map((b) => b.total));
  const L = labels ?? {};
  const noun = L.noun ?? "scan";
  const empty = `No ${noun}s in this range yet.`;

  const hero = stats[0];
  const secondary = stats.slice(1);
  const delta = locked ? null : trendDelta(buckets);

  return (
    <>
      {/* Hero: the headline metric + its trend, above the fold */}
      {hero && (
        <Card className="mb-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-500">{hero.label}</p>
              <p className="tabular mt-1 text-3xl font-semibold text-ink-900 sm:text-4xl">
                {hero.value}
              </p>
              {hero.hint && (
                <p className="mt-0.5 text-xs text-ink-400">{hero.hint}</p>
              )}
            </div>
            {delta !== null && (
              <span
                className={
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                  (delta >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600")
                }
              >
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
              </span>
            )}
          </div>
          {!locked && buckets.length > 0 && (
            <TrendChart buckets={buckets} maxTotal={maxTotal} noun={noun} />
          )}
        </Card>
      )}

      {/* Secondary metrics: dense, compact, no wasted air */}
      {secondary.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {secondary.map((s) => (
            <MiniStat key={s.label} {...s} />
          ))}
        </div>
      )}

      {locked ? (
        <LockedTeaser noun={noun} />
      ) : (
        <>
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
      )}
    </>
  );
}
