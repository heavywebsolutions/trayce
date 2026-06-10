import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, Button } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { EditDestinationForm } from "@/components/EditDestinationForm";
import { setStatus } from "@/app/dashboard/codes/actions";
import { qrSvg, redirectUrlFor } from "@/lib/qr";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { Code } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  active: "green",
  paused: "amber",
  archived: "gray",
};

export default async function CodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: code } = await supabase
    .from("codes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!code) notFound();
  const c = code as Code;

  const redirectUrl = redirectUrlFor(c.slug);
  const svg = await qrSvg(redirectUrl);

  const { data: scans } = await supabase
    .from("scans")
    .select("id, scanned_at, device_type, referrer")
    .eq("code_id", c.id)
    .order("scanned_at", { ascending: false })
    .limit(10);

  const { data: history } = await supabase
    .from("code_destinations")
    .select("id, destination_url, created_at")
    .eq("code_id", c.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/codes"
        className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-700"
      >
        ← All codes
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              {c.title}
            </h1>
            <Badge tone={statusTone[c.status]}>{c.status}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-500">
            Created {timeAgo(c.created_at)} · {formatNumber(c.scan_count)} scans
          </p>
        </div>
        <form action={setStatus}>
          <input type="hidden" name="code_id" value={c.id} />
          <input
            type="hidden"
            name="status"
            value={c.status === "active" ? "paused" : "active"}
          />
          <Button variant="secondary">
            {c.status === "active" ? "Pause" : "Activate"}
          </Button>
        </form>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* QR + link */}
        <Card className="p-6">
          <div
            className="mx-auto w-[200px] [&>svg]:h-auto [&>svg]:w-full [&>svg]:rounded-xl [&>svg]:border [&>svg]:border-ink-100"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-400">
            Scan link
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-ink-50 px-2.5 py-2 text-xs text-ink-700">
              {redirectUrl}
            </code>
            <CopyButton value={redirectUrl} />
          </div>
          <a
            href={`/api/qr/${c.slug}`}
            className="mt-3 block text-center text-xs font-medium text-accent hover:underline"
          >
            Download SVG
          </a>
        </Card>

        <div className="space-y-5">
          {/* Edit destination — the core dynamic mechanic */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink-900">
              Destination
            </h2>
            <p className="mb-4 mt-0.5 text-sm text-ink-500">
              Change where this code sends people. The printed QR never changes —
              this does.
            </p>
            <EditDestinationForm codeId={c.id} current={c.destination_url} />

            {history && history.length > 1 && (
              <div className="mt-5 border-t border-ink-100 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
                  Recent changes
                </p>
                <ul className="space-y-1.5">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="truncate text-ink-600">
                        {h.destination_url}
                      </span>
                      <span className="shrink-0 text-ink-400">
                        {timeAgo(h.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Scans */}
          <Card>
            <CardHeader title="Recent scans" />
            {scans && scans.length > 0 ? (
              <ul className="divide-y divide-ink-100">
                {scans.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <Badge tone={s.device_type === "mobile" ? "indigo" : "gray"}>
                      {s.device_type ?? "scan"}
                    </Badge>
                    <span className="tabular text-xs text-ink-400">
                      {timeAgo(s.scanned_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-8 text-center text-sm text-ink-500">
                No scans yet. Print it, stick it on something, and watch this
                fill up.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
