import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, IconChip } from "@/components/ui";
import { IconQr } from "@/components/icons";
import { CreateCodeForm } from "@/components/CreateCodeForm";
import { qrContentFor } from "@/lib/qr";
import { formatNumber } from "@/lib/utils";
import type { Code } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const statusTone: Record<string, string> = {
  active: "green",
  paused: "amber",
  archived: "gray",
};

// Small QR thumbnail in the code's own colors, encoding exactly what the printed
// code does. Best-effort: a failure just yields no thumbnail, never an error.
async function thumbFor(c: Code): Promise<string> {
  try {
    return await QRCode.toString(qrContentFor(c), {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: {
        dark: (c.fg_color as string) || "#0A2540",
        light: (c.bg_color as string) || "#FFFFFF",
      },
      width: 96,
    });
  } catch {
    return "";
  }
}

export default async function CodesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: codes, count } = await supabase
    .from("codes")
    .select("*", { count: "exact" })
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .range(from, to);

  const list = (codes ?? []) as Code[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const thumbs = await Promise.all(list.map(thumbFor));

  const showingFrom = total === 0 ? 0 : from + 1;
  const showingTo = from + list.length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Codes
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Each code is a dynamic QR you can re-point anytime.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit min-w-0 p-6">
          <h2 className="text-base font-semibold text-ink-900">New code</h2>
          <p className="mb-5 mt-0.5 text-sm text-ink-500">
            Takes about ten seconds.
          </p>
          <CreateCodeForm />
        </Card>

        <Card className="min-w-0">
          <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <IconChip color="blue" size="sm">
                <IconQr />
              </IconChip>
              <div>
                <h2 className="text-base font-semibold text-ink-900">
                  Your codes
                </h2>
                <p className="mt-0.5 text-sm text-ink-500">
                  {total} {total === 1 ? "code" : "codes"}
                </p>
              </div>
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
                {list.map((c, i) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/codes/${c.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition hover:bg-ink-50"
                    >
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white p-1 [&>svg]:h-full [&>svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: thumbs[i] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {c.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-400">
                          /{c.slug} &rarr; {c.destination_url}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        {c.type === "static" ? (
                          <Badge tone="gray">Static</Badge>
                        ) : (
                          <div className="text-right">
                            <p className="tabular text-sm font-semibold text-ink-900">
                              {formatNumber(c.scan_count)}
                            </p>
                            <p className="text-[11px] text-ink-400">scans</p>
                          </div>
                        )}
                        <Badge tone={statusTone[c.status]}>{c.status}</Badge>
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
                        href={`/dashboard/codes?page=${page - 1}`}
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
                        href={`/dashboard/codes?page=${page + 1}`}
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
              <p className="text-sm font-medium text-ink-700">No codes yet</p>
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
