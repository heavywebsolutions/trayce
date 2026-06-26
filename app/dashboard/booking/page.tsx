import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import { CreateBookingForm } from "@/components/CreateBookingForm";
import { formatNumber } from "@/lib/utils";
import { loadEntitlements } from "@/lib/plan";
import type { BookingLink } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const statusTone: Record<string, string> = {
  active: "green",
  paused: "amber",
  archived: "gray",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const gate = await loadEntitlements();
  const entitled = gate?.ent.bookingAttribution ?? false;

  const supabase = await createClient();
  const { data: links, count } = await supabase
    .from("booking_links")
    .select("*", { count: "exact" })
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .range(from, to);

  const list = (links ?? []) as BookingLink[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : from + 1;
  const showingTo = from + list.length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Booking
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Make the booker you already use measurable from the real world.
        </p>
      </div>

      {!entitled && (
        <div className="mb-6 rounded-2xl border border-accent-soft bg-accent-soft/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-ink-900">
                Booking attribution is a Growth feature
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Wrap your existing booker with tagged QR placements, capture a
                lead before hand-off, and see which sign or channel actually
                books. Upgrade to turn it on.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="shrink-0 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Upgrade to Growth
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit min-w-0 p-6">
          <h2 className="text-base font-semibold text-ink-900">New booking link</h2>
          <p className="mb-5 mt-0.5 text-sm text-ink-500">
            Point at your booker, then tag every spot you post it.
          </p>
          <CreateBookingForm disabled={!entitled} />
        </Card>

        <Card className="min-w-0">
          <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink-900">
                Your booking links
              </h2>
              <p className="mt-0.5 text-sm text-ink-500">
                {total} {total === 1 ? "link" : "links"}
              </p>
            </div>
            {total > 0 && (
              <span className="shrink-0 text-xs text-ink-400">
                Showing {showingFrom}&ndash;{showingTo}
              </span>
            )}
          </div>

          {list.length > 0 ? (
            <>
              <ul className="divide-y divide-ink-100">
                {list.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/dashboard/booking/${b.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition hover:bg-ink-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {b.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-400">
                          {b.destination_url}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <p className="tabular text-sm font-semibold text-ink-900">
                            {formatNumber(b.tap_count)}
                          </p>
                          <p className="text-[11px] text-ink-400">taps</p>
                        </div>
                        {b.capture_lead && <Badge tone="indigo">Capture</Badge>}
                        <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 border-t border-ink-100 px-6 py-3.5">
                  <span className="text-xs text-ink-400">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    {page > 1 ? (
                      <Link
                        href={`/dashboard/booking?page=${page - 1}`}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed rounded-lg border border-ink-100 px-3 py-1.5 text-sm font-medium text-ink-300">
                        Previous
                      </span>
                    )}
                    {page < totalPages ? (
                      <Link
                        href={`/dashboard/booking?page=${page + 1}`}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed rounded-lg border border-ink-100 px-3 py-1.5 text-sm font-medium text-ink-300">
                        Next
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-ink-700">No booking links yet</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-ink-500">
                Create your first one with the form on the left.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
