import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, Button, Input, Label } from "@/components/ui";
import { CopyUrlButton } from "@/components/CopyUrlButton";
import { AddPlacementForm } from "@/components/AddPlacementForm";
import { formatNumber } from "@/lib/utils";
import { resolveRange, bucketize } from "@/lib/analytics";
import {
  bookingUrlFor,
  channelLabel,
  placementStats,
  channelStats,
  bookingTotals,
  tapsAsScans,
} from "@/lib/booking";
import {
  updateBookingLink,
  setBookingLinkStatus,
  archivePlacement,
  setLeadBooked,
} from "../actions";
import type { BookingLink, BookingPlacement } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  active: "green",
  paused: "amber",
  archived: "gray",
};
const RANGES = [
  { r: "7", label: "7d" },
  { r: "30", label: "30d" },
  { r: "90", label: "90d" },
];

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

async function qrThumb(url: string): Promise<string> {
  try {
    return await QRCode.toString(url, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#0A2540", light: "#FFFFFF" },
      width: 96,
    });
  } catch {
    return "";
  }
}

type LeadRow = {
  id: string;
  email: string;
  name: string | null;
  placement_id: string | null;
  booked: boolean | null;
  booked_value_cents: number | null;
  created_at: string;
  source: string | null;
};

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const range = resolveRange({ r: sp.r });

  const supabase = await createClient();
  const { data: linkData } = await supabase
    .from("booking_links")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!linkData) notFound();
  const link = linkData as BookingLink;

  const { data: placementsData } = await supabase
    .from("booking_placements")
    .select("*")
    .eq("booking_link_id", id)
    .neq("status", "archived")
    .order("created_at", { ascending: true });
  const placements = (placementsData ?? []) as BookingPlacement[];

  const { data: tapsData } = await supabase
    .from("booking_taps")
    .select("tapped_at, placement_id, ip_hash")
    .eq("booking_link_id", id)
    .gte("tapped_at", range.from.toISOString());
  const taps = tapsData ?? [];

  const { data: leadsData } = await supabase
    .from("leads")
    .select("id, email, name, placement_id, booked, booked_value_cents, created_at, source")
    .eq("booking_link_id", id)
    .order("created_at", { ascending: false });
  const allLeads = (leadsData ?? []) as LeadRow[];
  const leadsInRange = allLeads.filter(
    (l) => new Date(l.created_at) >= range.from
  );

  const pStats = placementStats({
    placements: placements.map((p) => ({
      id: p.id,
      label: p.label,
      channel: p.channel,
    })),
    taps,
    leads: leadsInRange,
    avgValueCents: link.avg_value_cents,
  });
  const cStats = channelStats(pStats);
  const totals = bookingTotals({
    taps,
    leads: leadsInRange,
    avgValueCents: link.avg_value_cents,
  });
  const buckets = bucketize(tapsAsScans(taps), range);
  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));
  const maxShare = Math.max(1, ...pStats.map((p) => p.taps));

  const thumbs = await Promise.all(
    placements.map((p) => qrThumb(bookingUrlFor(p.slug)))
  );
  const placementLabel = new Map(placements.map((p) => [p.id, p.label]));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/booking"
            className="text-xs font-medium text-ink-400 hover:text-ink-600"
          >
            &larr; Booking
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink-900">
            {link.name}
            <Badge tone={statusTone[link.status]}>{link.status}</Badge>
          </h1>
          <p className="mt-0.5 truncate text-sm text-ink-500">
            Forwards to {link.destination_url}
          </p>
        </div>
      </div>

      {/* Funnel headline */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Booking taps", v: formatNumber(totals.taps) },
          { l: "Leads captured", v: formatNumber(totals.leads) },
          { l: "Marked booked", v: formatNumber(totals.booked) },
          { l: "Est. booked rev", v: money(totals.revenueCents) },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <p className="text-xs uppercase tracking-wide text-ink-500">{s.l}</p>
            <p className="mt-1 text-2xl font-semibold text-ink-900">{s.v}</p>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex items-center gap-2">
        <span className="text-xs text-ink-400">Range</span>
        {RANGES.map((opt) => (
          <Link
            key={opt.r}
            href={`/dashboard/booking/${id}?r=${opt.r}`}
            className={
              (range.preset ?? 30) === Number(opt.r)
                ? "rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-semibold text-white"
                : "rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50"
            }
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Taps over time */}
      <Card className="mb-5 p-6">
        <h2 className="text-base font-semibold text-ink-900">Taps over time</h2>
        <div className="mt-5 flex h-32 items-end gap-1">
          {buckets.map((b) => (
            <div key={b.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-accent/80"
                style={{ height: `${(b.total / maxBucket) * 100}%` }}
                title={`${b.label}: ${b.total}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ink-400">
          <span>{buckets[0]?.label}</span>
          <span>{buckets[buckets.length - 1]?.label}</span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* By placement */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink-900">By placement</h2>
          {pStats.length > 0 ? (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="pb-2">Placement</th>
                  <th className="pb-2 text-right">Taps</th>
                  <th className="pb-2 text-right">Leads</th>
                  <th className="pb-2 text-right">Booked</th>
                </tr>
              </thead>
              <tbody>
                {pStats.map((p) => (
                  <tr key={p.id} className="border-t border-ink-100">
                    <td className="py-2">
                      <span className="font-medium text-ink-900">{p.label}</span>
                      <span className="ml-2 text-xs text-ink-400">
                        {channelLabel(p.channel)}
                      </span>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(p.taps / maxShare) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2 text-right tabular">{p.taps}</td>
                    <td className="py-2 text-right tabular">{p.leads}</td>
                    <td className="py-2 text-right tabular">{p.booked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-4 text-sm text-ink-500">
              Add a placement to start attributing taps.
            </p>
          )}
        </Card>

        {/* By channel */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink-900">By channel</h2>
          {cStats.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {cStats.map((c) => (
                <li key={c.channel}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-700">{c.label}</span>
                    <span className="font-semibold text-ink-900">
                      {c.taps} taps
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${(c.taps / Math.max(1, cStats[0].taps)) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-500">No taps yet.</p>
          )}
        </Card>
      </div>

      {/* Placements management */}
      <Card className="mt-5 p-6">
        <h2 className="text-base font-semibold text-ink-900">Placements</h2>
        <p className="mb-4 mt-0.5 text-sm text-ink-500">
          Each spot you post it gets its own link and QR, so you know what books.
        </p>
        <AddPlacementForm linkId={id} />

        {placements.length > 0 && (
          <ul className="mt-5 divide-y divide-ink-100">
            {placements.map((p, i) => {
              const url = bookingUrlFor(p.slug);
              return (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white p-1 [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: thumbs[i] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                      {p.label}
                      <Badge tone="gray">{channelLabel(p.channel)}</Badge>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-400">
                      {url} &middot; {formatNumber(p.tap_count)} taps
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <CopyUrlButton url={url} />
                    <form action={archivePlacement}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="booking_link_id" value={id} />
                      <Button variant="ghost" type="submit" className="text-rose-500">
                        Remove
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Recent leads + mark booked */}
      <Card className="mt-5 p-6">
        <h2 className="text-base font-semibold text-ink-900">Captured leads</h2>
        <p className="mb-4 mt-0.5 text-sm text-ink-500">
          Mark a lead booked (and its value) to attribute real revenue to a placement.
        </p>
        {allLeads.length > 0 ? (
          <ul className="divide-y divide-ink-100">
            {allLeads.slice(0, 25).map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {l.name || l.email}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {l.email}
                    {l.placement_id && placementLabel.get(l.placement_id)
                      ? ` · ${placementLabel.get(l.placement_id)}`
                      : ""}
                  </p>
                </div>
                {l.booked ? (
                  <form action={setLeadBooked} className="flex items-center gap-2">
                    <input type="hidden" name="lead_id" value={l.id} />
                    <input type="hidden" name="booking_link_id" value={id} />
                    <input type="hidden" name="booked" value="false" />
                    <Badge tone="green">
                      Booked
                      {typeof l.booked_value_cents === "number"
                        ? ` · ${money(l.booked_value_cents)}`
                        : ""}
                    </Badge>
                    <Button variant="ghost" type="submit" className="text-xs">
                      Undo
                    </Button>
                  </form>
                ) : (
                  <form action={setLeadBooked} className="flex items-center gap-2">
                    <input type="hidden" name="lead_id" value={l.id} />
                    <input type="hidden" name="booking_link_id" value={id} />
                    <input type="hidden" name="booked" value="true" />
                    <Input
                      name="value"
                      placeholder="$ value"
                      className="h-9 w-24 min-h-0 py-1"
                    />
                    <Button variant="secondary" type="submit" className="text-xs">
                      Mark booked
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">
            No leads yet. Turn on &ldquo;capture a lead first&rdquo; below to start
            collecting contacts before the booker.
          </p>
        )}
      </Card>

      {/* Settings */}
      <Card className="mt-5 p-6">
        <h2 className="text-base font-semibold text-ink-900">Settings</h2>
        <form action={updateBookingLink} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={link.name} />
            </div>
            <div>
              <Label htmlFor="avg_value">Avg booking value (optional)</Label>
              <Input
                id="avg_value"
                name="avg_value"
                placeholder="$150"
                defaultValue={
                  link.avg_value_cents ? String(link.avg_value_cents / 100) : ""
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="destination_url">Your booking URL</Label>
            <Input
              id="destination_url"
              name="destination_url"
              defaultValue={link.destination_url}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-ink-700">
            <input
              type="checkbox"
              name="capture_lead"
              defaultChecked={link.capture_lead}
              className="h-4 w-4 rounded border-ink-300 text-accent"
            />
            Capture a lead before the booking hand-off
          </label>
          <label className="flex items-center gap-3 text-sm text-ink-700">
            <input
              type="checkbox"
              name="capture_collect_phone"
              defaultChecked={link.capture_collect_phone}
              className="h-4 w-4 rounded border-ink-300 text-accent"
            />
            Also ask for a phone number
          </label>
          <Button type="submit">Save settings</Button>
        </form>

        <div className="mt-6 border-t border-ink-100 pt-4">
          <form action={setBookingLinkStatus}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="archived" />
            <Button variant="danger" type="submit">
              Archive booking link
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
