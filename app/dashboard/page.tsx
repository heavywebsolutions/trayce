import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Button, Badge } from "@/components/ui";
import { formatNumber, timeAgo } from "@/lib/utils";
import { formatLocation, deviceLabel } from "@/lib/geo";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  hint,
  reserved,
}: {
  label: string;
  value: string;
  hint?: string;
  reserved?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p
        className={`tabular mt-2 text-3xl font-semibold ${
          reserved ? "text-ink-300" : "text-ink-900"
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-ink-400">
          {reserved && <Badge tone="gray">Coming soon</Badge>}{" "}
          {hint}
        </p>
      )}
    </Card>
  );
}

export default async function OverviewPage() {
  const supabase = await createClient();

  const { data: codes } = await supabase
    .from("codes")
    .select("id, scan_count, status")
    .neq("status", "archived");

  const totalScans = (codes ?? []).reduce((s, c) => s + (c.scan_count ?? 0), 0);
  const activeCodes = (codes ?? []).filter((c) => c.status === "active").length;
  const hasCodes = (codes ?? []).length > 0;

  const { data: recent } = await supabase
    .from("scans")
    .select(
      "id, scanned_at, device_type, user_agent, city, region, country, code_id, codes(title, slug, destination_url)"
    )
    .order("scanned_at", { ascending: false })
    .limit(8);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Overview
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Here&apos;s what your codes are doing.
          </p>
        </div>
        <Link href="/dashboard/codes">
          <Button>Create a code</Button>
        </Link>
      </div>

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

      {/* Revenue leads (reserved) — Rahil: lead with the dollar, even before it's wired. */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attributed revenue"
          value="$—"
          reserved
          hint="Connect a store to stitch scans to sales"
        />
        <StatCard label="Total scans" value={formatNumber(totalScans)} hint="All time" />
        <StatCard label="Active codes" value={formatNumber(activeCodes)} hint="Live now" />
        <StatCard
          label="In lifecycle"
          value="—"
          reserved
          hint="Customer journey stages"
        />
      </div>

      <Card>
        <CardHeader
          title="Recent scans"
          subtitle="Live activity across all your codes"
        />
        {recent && recent.length > 0 ? (
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
                      <Badge
                        tone={s.device_type === "mobile" ? "indigo" : "gray"}
                      >
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
    </div>
  );
}
