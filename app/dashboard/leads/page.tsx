import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";
import { Card, IconChip, type ChipColor } from "@/components/ui";
import { IconQr, IconBio, IconBooking, IconLeads } from "@/components/icons";
import { LeadsControls } from "@/components/LeadsControls";
import { formatNumber, timeAgo, cn } from "@/lib/utils";
import {
  resolveLeadRange,
  unifyLeads,
  topSources,
  type SourceType,
} from "@/lib/leads";

export const dynamic = "force-dynamic";

const RANGE_LABEL: Record<string, string> = {
  today: "today",
  yesterday: "yesterday",
  "7": "in the last 7 days",
  "30": "in the last 30 days",
  "365": "in the last 12 months",
  all: "all time",
};

function QrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h3v3M20.5 20.5h.01M20.5 14.5h.01M14.5 20.5h.01" />
    </svg>
  );
}

function BioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M9.5 6.5h5M9.5 10h5M9.5 13.5h3" />
    </svg>
  );
}

function BookingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

function SourceIcon({ type, className }: { type: SourceType; className?: string }) {
  if (type === "qr") return <QrIcon className={className} />;
  if (type === "booking") return <BookingIcon className={className} />;
  return <BioIcon className={className} />;
}

// Small pill marking where a lead came from.
function SourceBadge({
  type,
  label,
  detail,
}: {
  type: SourceType;
  label: string;
  detail?: string | null;
}) {
  const tone =
    type === "qr"
      ? "border-blue-100 bg-accent-soft text-accent"
      : type === "booking"
        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
        : "border-violet-100 bg-violet-50 text-violet-700";
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone
      )}
    >
      <SourceIcon type={type} className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      {detail && (
        <span className="hidden truncate font-normal opacity-70 sm:inline">
          · {detail}
        </span>
      )}
    </span>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
  color = "blue",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  color?: ChipColor;
}) {
  return (
    <Card className="p-4 sm:px-5">
      {icon && (
        <IconChip color={color} className="mb-2.5">
          {icon}
        </IconChip>
      )}
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
    </Card>
  );
}

function placeOf(l: {
  city: string | null;
  region: string | null;
  country: string | null;
}): string | null {
  const parts = [l.city, l.region].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return l.country || null;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; src?: string }>;
}) {
  const sp = await searchParams;
  const range = resolveLeadRange(sp.r);
  const src =
    sp.src === "qr" || sp.src === "bio" || sp.src === "booking"
      ? sp.src
      : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  // RLS scopes every query to the signed-in owner's workspace.
  const [
    { data: leadRows },
    { data: subRows },
    { data: pageRows },
    { data: bookingRows },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "email, name, phone, city, region, country, source, created_at, code_id, page_id, booking_link_id, placement_id, codes(title)"
      )
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("bio_subscribers")
      .select("email, city, region, country, created_at, page_id")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("bio_pages").select("id, display_name, handle"),
    supabase.from("booking_links").select("id, name"),
  ]);

  const pageName = new Map<string, string>();
  for (const p of pageRows ?? []) {
    pageName.set(
      p.id as string,
      (p.display_name as string) || `@${p.handle as string}`
    );
  }
  const bookingName = new Map<string, string>();
  for (const b of bookingRows ?? []) {
    bookingName.set(b.id as string, (b.name as string) || "Booking");
  }

  const all = unifyLeads({
    leads: leadRows ?? [],
    subscribers: subRows ?? [],
    pageName,
    bookingName,
  });

  const rows = all.filter((l) => (src === "all" ? true : l.sourceType === src));

  const total = rows.length;
  const qrCount = rows.filter((l) => l.sourceType === "qr").length;
  const bioCount = rows.filter((l) => l.sourceType === "bio").length;
  const bookingCount = rows.filter((l) => l.sourceType === "booking").length;
  const pct = (n: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}% of total` : "—";
  const sources = topSources(rows);
  const maxSource = sources[0]?.count ?? 0;

  const hasAny = total > 0;
  const rangeLabel = RANGE_LABEL[range.key] ?? "in range";
  const display = rows.slice(0, 200);

  const csvHref = `/api/leads.csv?r=${range.key}&src=${src}`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Leads
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Every contact your codes and pages captured.
          </p>
        </div>
        <a
          href={csvHref}
          className="shrink-0 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
        >
          Download CSV
        </a>
      </div>

      <LeadsControls />

      {/* At-a-glance totals */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Total leads"
          value={formatNumber(total)}
          sub={`Captured ${rangeLabel}`}
          icon={<IconLeads />}
          color="emerald"
        />
        <StatTile
          label="From QR codes"
          value={formatNumber(qrCount)}
          sub={pct(qrCount)}
          icon={<IconQr />}
          color="blue"
        />
        <StatTile
          label="From bio pages"
          value={formatNumber(bioCount)}
          sub={pct(bioCount)}
          icon={<IconBio />}
          color="violet"
        />
        <StatTile
          label="From booking"
          value={formatNumber(bookingCount)}
          sub={pct(bookingCount)}
          icon={<IconBooking />}
          color="amber"
        />
      </div>

      {!hasAny ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink-700">
            No leads {rangeLabel}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
            Add a lead-capture form to a QR code or a bio page, share it, and new
            contacts will show up here with their source.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/dashboard/codes">
              <span className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
                Go to codes
              </span>
            </Link>
            <Link href="/dashboard/bio">
              <span className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
                Go to bio pages
              </span>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Top sources: which code / which page drove the leads */}
          <Card className="h-fit p-5">
            <h2 className="text-sm font-semibold text-ink-900">Top sources</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Where your leads came from
            </p>
            <ul className="mt-4 space-y-3">
              {sources.map((s) => (
                <li key={`${s.type}:${s.label}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <SourceIcon
                        type={s.type}
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          s.type === "qr"
                            ? "text-accent"
                            : s.type === "booking"
                              ? "text-emerald-600"
                              : "text-violet-600"
                        )}
                      />
                      <span className="truncate text-sm text-ink-700">
                        {s.label}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-ink-900">
                      {formatNumber(s.count)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        s.type === "qr" ? "bg-accent" : "bg-violet-500"
                      )}
                      style={{
                        width: `${maxSource ? (s.count / maxSource) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* The leads themselves */}
          <Card>
            <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-ink-900">
                {src === "qr"
                  ? "QR code leads"
                  : src === "bio"
                    ? "Bio page leads"
                    : "All leads"}
              </h2>
              <span className="text-xs text-ink-400">
                {formatNumber(total)} {total === 1 ? "contact" : "contacts"}
                {total > display.length ? ` · showing ${display.length}` : ""}
              </span>
            </div>
            <ul className="divide-y divide-ink-100">
              {display.map((l, i) => {
                const place = placeOf(l);
                return (
                  <li
                    key={`${l.email}-${l.created_at}-${i}`}
                    className="flex items-center justify-between gap-4 px-6 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {l.name || l.email}
                      </p>
                      <p className="truncate text-xs text-ink-400">
                        {l.email}
                        {l.phone ? ` · ${l.phone}` : ""}
                        {place ? ` · ${place}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <SourceBadge
                        type={l.sourceType}
                        label={l.sourceLabel}
                        detail={l.sourceDetail}
                      />
                      <span className="text-[11px] text-ink-400">
                        {timeAgo(l.created_at)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
