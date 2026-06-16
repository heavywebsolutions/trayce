import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge } from "@/components/ui";
import { CreateCodeForm } from "@/components/CreateCodeForm";
import { formatNumber } from "@/lib/utils";
import type { Code } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  active: "green",
  paused: "amber",
  archived: "gray",
};

export default async function CodesPage() {
  const supabase = await createClient();
  const { data: codes } = await supabase
    .from("codes")
    .select("*")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  const list = (codes ?? []) as Code[];

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
          <CardHeader
            title="Your codes"
            subtitle={`${list.length} ${list.length === 1 ? "code" : "codes"}`}
          />
          {list.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {list.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/codes/${c.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {c.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-400">
                        /{c.slug} → {c.destination_url}
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
