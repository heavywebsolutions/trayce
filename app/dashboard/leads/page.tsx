import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui";
import { formatNumber, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leads, count } = await supabase
    .from("leads")
    .select(
      "id, email, name, phone, city, region, country, source, created_at, codes(title, slug)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = leads ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Leads
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Contacts captured by your lead-form codes.
          </p>
        </div>
        {(count ?? 0) > 0 && (
          <a
            href="/api/leads.csv"
            className="rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Download CSV
          </a>
        )}
      </div>

      <Card>
        <CardHeader
          title="All leads"
          subtitle={`${formatNumber(count ?? 0)} total`}
        />
        {rows.length > 0 ? (
          <ul className="divide-y divide-ink-100">
            {rows.map((l) => {
              const code = Array.isArray(l.codes) ? l.codes[0] : l.codes;
              return (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-4 px-6 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {l.name || l.email}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {l.email}
                      {l.phone ? ` · ${l.phone}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="truncate text-xs text-ink-500">
                      {code?.title ?? l.source ?? "—"}
                    </p>
                    <p className="tabular text-[11px] text-ink-400">
                      {timeAgo(l.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-ink-700">No leads yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
              Switch any dynamic code to a lead-capture form (on its page), print
              it, and submissions land here.
            </p>
            <Link href="/dashboard/codes" className="mt-4 inline-block">
              <span className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
                Go to codes
              </span>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
