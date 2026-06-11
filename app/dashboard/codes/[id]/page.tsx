import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, Button } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { EditDestinationForm } from "@/components/EditDestinationForm";
import { setStatus, convertToDynamic } from "@/app/dashboard/codes/actions";
import { qrContentFor } from "@/lib/qr";
import { QrDesigner } from "@/components/QrDesigner";
import { formatNumber, timeAgo } from "@/lib/utils";
import { formatLocation, deviceLabel } from "@/lib/geo";
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

  const isStatic = c.type === "static";
  const qrContent = qrContentFor(c);

  const { data: scans } = await supabase
    .from("scans")
    .select("id, scanned_at, device_type, referrer, city, region, country, user_agent")
    .eq("code_id", c.id)
    .order("scanned_at", { ascending: false })
    .limit(10);

  const { data: history } = await supabase
    .from("code_destinations")
    .select("id, destination_url, created_at")
    .eq("code_id", c.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: templates } = await supabase
    .from("design_templates")
    .select("*")
    .eq("workspace_id", c.workspace_id)
    .order("created_at", { ascending: false });

  const { data: logos } = await supabase
    .from("logo_assets")
    .select("*")
    .eq("workspace_id", c.workspace_id)
    .order("created_at", { ascending: false })
    .limit(12);

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
            <Badge tone={isStatic ? "gray" : "indigo"}>
              {isStatic ? "Static" : "Dynamic"}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-500">
            Created {timeAgo(c.created_at)} · {formatNumber(c.scan_count)} scans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/codes/${c.id}/analytics`}>
            <Button variant="secondary">Analytics</Button>
          </Link>
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
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* QR designer + link */}
        <Card className="p-6">
          <QrDesigner
            codeId={c.id}
            content={qrContent}
            initial={{
              fg: c.fg_color,
              bg: c.bg_color,
              dot: c.dot_style,
              corner: c.corner_style,
              logo: c.logo_url,
              frame: c.frame_style,
              frameColor: c.frame_color,
              frameText: c.frame_text,
            }}
            templates={templates ?? []}
            logos={logos ?? []}
          />
          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-400">
            {isStatic ? "Encodes directly" : "Scan link"}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-ink-50 px-2.5 py-2 text-xs text-ink-700">
              {qrContent}
            </code>
            <CopyButton value={qrContent} />
          </div>
        </Card>

        <div className="space-y-5">
          {isStatic ? (
            <>
              {/* Static: read-only destination + upgrade nudge */}
              <Card className="p-6">
                <h2 className="text-base font-semibold text-ink-900">
                  Destination
                </h2>
                <p className="mb-3 mt-0.5 text-sm text-ink-500">
                  This is a static code, so the URL is baked straight into the QR
                  — it can&apos;t be changed once it&apos;s printed.
                </p>
                <code className="block truncate rounded-lg bg-ink-50 px-3 py-2.5 text-sm text-ink-700">
                  {c.destination_url}
                </code>
              </Card>

              <Card className="border-accent-ring/30 bg-accent-soft/40 p-6">
                <h2 className="text-base font-semibold text-ink-900">
                  Want to edit this — or see who scans it?
                </h2>
                <p className="mt-1 text-sm text-ink-600">
                  Make it dynamic and you can re-point it anytime and track every
                  scan, without reprinting. Best done before you print this one,
                  since converting changes what the QR encodes.
                </p>
                <form action={convertToDynamic} className="mt-4">
                  <input type="hidden" name="code_id" value={c.id} />
                  <Button>Make it dynamic</Button>
                </form>
              </Card>
            </>
          ) : (
            <>
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
                  <li key={s.id} className="px-6 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {c.title}
                      </p>
                      <span className="tabular shrink-0 text-xs text-ink-400">
                        {timeAgo(s.scanned_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-400">
                      /{c.slug} → {c.destination_url}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      <Badge
                        tone={s.device_type === "mobile" ? "indigo" : "gray"}
                      >
                        {deviceLabel(s.user_agent)}
                      </Badge>
                      <span className="text-ink-300">·</span>
                      <span>{formatLocation(s)}</span>
                    </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
