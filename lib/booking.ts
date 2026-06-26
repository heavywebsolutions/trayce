import type { ScanLite } from "@/lib/analytics";

// Booking attribution data layer. Pure, testable rollups that turn raw taps +
// captured leads into the funnel the dashboard shows: taps -> leads -> booked
// -> revenue, broken out by placement and channel. Mirrors lib/leads.ts and
// reuses lib/analytics bucketize for the over-time chart.

export type BookingChannel =
  | "in_person"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "google"
  | "web"
  | "other";

export const BOOKING_CHANNELS: { v: BookingChannel; label: string }[] = [
  { v: "in_person", label: "In person (print)" },
  { v: "instagram", label: "Instagram" },
  { v: "facebook", label: "Facebook" },
  { v: "tiktok", label: "TikTok" },
  { v: "youtube", label: "YouTube" },
  { v: "google", label: "Google profile" },
  { v: "web", label: "Website" },
  { v: "other", label: "Other" },
];

const CHANNEL_LABEL = new Map(BOOKING_CHANNELS.map((c) => [c.v, c.label]));

export function channelLabel(v: string | null | undefined): string {
  return (v && CHANNEL_LABEL.get(v as BookingChannel)) || "Other";
}

export function isBookingChannel(v: string): v is BookingChannel {
  return CHANNEL_LABEL.has(v as BookingChannel);
}

// The public URL a placement QR / link encodes. Routes through /b/<slug> so the
// source is baked into the slug, with no visible tracking tail. Uses the same
// base resolution as the QR redirect engine.
export function bookingUrlFor(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_REDIRECT_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/b/${slug}`;
}

// --- Rollups -----------------------------------------------------------

export type PlacementLite = {
  id: string;
  label: string;
  channel: string;
};

export type TapLite = {
  placement_id: string | null;
  tapped_at: string;
  ip_hash?: string | null;
};

export type LeadLite = {
  placement_id?: string | null;
  booked?: boolean | null;
  booked_value_cents?: number | null;
};

export type PlacementStat = {
  id: string;
  label: string;
  channel: string;
  taps: number;
  leads: number;
  booked: number;
  revenueCents: number;
};

export type FunnelTotals = {
  taps: number;
  leads: number;
  booked: number;
  revenueCents: number;
};

// Revenue for a booked lead: its own logged value, else the link's average
// booking value, else zero. Keeps the headline honest when values are sparse.
function leadRevenue(lead: LeadLite, avgValueCents: number | null): number {
  if (typeof lead.booked_value_cents === "number" && lead.booked_value_cents > 0)
    return lead.booked_value_cents;
  return avgValueCents && avgValueCents > 0 ? avgValueCents : 0;
}

// Per-placement funnel, newest-strongest first (by taps). Placements with no
// activity are still included so the owner sees everything they created.
export function placementStats(opts: {
  placements: PlacementLite[];
  taps: TapLite[];
  leads: LeadLite[];
  avgValueCents?: number | null;
}): PlacementStat[] {
  const { placements, taps, leads } = opts;
  const avg = opts.avgValueCents ?? null;

  const base = new Map<string, PlacementStat>(
    placements.map((p) => [
      p.id,
      {
        id: p.id,
        label: p.label,
        channel: p.channel,
        taps: 0,
        leads: 0,
        booked: 0,
        revenueCents: 0,
      },
    ])
  );

  for (const t of taps) {
    if (!t.placement_id) continue;
    const row = base.get(t.placement_id);
    if (row) row.taps += 1;
  }

  for (const l of leads) {
    if (!l.placement_id) continue;
    const row = base.get(l.placement_id);
    if (!row) continue;
    row.leads += 1;
    if (l.booked) {
      row.booked += 1;
      row.revenueCents += leadRevenue(l, avg);
    }
  }

  return [...base.values()].sort((a, b) => b.taps - a.taps);
}

// Roll placement stats up to channel level.
export function channelStats(rows: PlacementStat[]): Array<{
  channel: string;
  label: string;
  taps: number;
  leads: number;
  booked: number;
  revenueCents: number;
}> {
  const map = new Map<
    string,
    { channel: string; label: string; taps: number; leads: number; booked: number; revenueCents: number }
  >();
  for (const r of rows) {
    const cur = map.get(r.channel);
    if (cur) {
      cur.taps += r.taps;
      cur.leads += r.leads;
      cur.booked += r.booked;
      cur.revenueCents += r.revenueCents;
    } else {
      map.set(r.channel, {
        channel: r.channel,
        label: channelLabel(r.channel),
        taps: r.taps,
        leads: r.leads,
        booked: r.booked,
        revenueCents: r.revenueCents,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.taps - a.taps);
}

// Funnel headline numbers across the whole booking link.
export function bookingTotals(opts: {
  taps: TapLite[];
  leads: LeadLite[];
  avgValueCents?: number | null;
}): FunnelTotals {
  const avg = opts.avgValueCents ?? null;
  let booked = 0;
  let revenueCents = 0;
  for (const l of opts.leads) {
    if (l.booked) {
      booked += 1;
      revenueCents += leadRevenue(l, avg);
    }
  }
  return { taps: opts.taps.length, leads: opts.leads.length, booked, revenueCents };
}

// Adapt booking taps to the ScanLite shape so lib/analytics bucketize/uniqueCount
// can chart them over time with zero duplicated bucketing logic.
export function tapsAsScans(taps: TapLite[]): ScanLite[] {
  return taps.map((t) => ({
    scanned_at: t.tapped_at,
    device_type: null,
    city: null,
    region: null,
    country: null,
    user_agent: null,
    ip_hash: t.ip_hash ?? null,
  }));
}
