import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui";
import { CreateBioForm } from "@/components/CreateBioForm";
import { formatNumber } from "@/lib/utils";
import { loadEntitlements } from "@/lib/plan";
import { activeBioPageIds, isOverBioLimit } from "@/lib/bioLimit";
import { chooseActiveBioPage } from "./actions";
import type { BioPage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BioListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pages } = await supabase
    .from("bio_pages")
    .select("*")
    .order("created_at", { ascending: false });
  const list = (pages ?? []) as BioPage[];

  const gate = await loadEntitlements();
  const limit = gate?.ent.bioPageLimit ?? Infinity;
  const overLimit = isOverBioLimit(list.length, limit);
  const live = activeBioPageIds(list, limit);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Bio pages
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          One branded link-in-bio page, every one comes with a QR and click
          tracking.
        </p>
      </div>

      {overLimit && (
        <div className="mb-6 rounded-2xl border border-accent-soft bg-accent-soft/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-ink-900">
                Your plan includes one bio page
              </p>
              <p className="mt-1 text-sm text-ink-600">
                You have {list.length}. Choose the one to keep live below. The
                rest stay saved here, but their links and QR codes will send
                visitors to your live page until you upgrade. Nothing is
                deleted.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="shrink-0 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Upgrade for unlimited
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit p-6">
          <h2 className="text-base font-semibold text-ink-900">New page</h2>
          <p className="mb-5 mt-0.5 text-sm text-ink-500">Pick a handle.</p>
          <CreateBioForm />
        </Card>

        <Card>
          <CardHeader
            title="Your pages"
            subtitle={`${list.length} ${list.length === 1 ? "page" : "pages"}`}
          />
          {list.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {list.map((p) => {
                const isLive = live.has(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <Link
                      href={`/dashboard/bio/${p.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink-900">
                        <span className="truncate">
                          {p.display_name || p.handle}
                        </span>
                        {overLimit &&
                          (isLive ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              Live
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                              Paused
                            </span>
                          ))}
                      </p>
                      <p className="truncate text-xs text-ink-400">
                        @{p.handle}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-4">
                      {overLimit && !isLive && (
                        <form action={chooseActiveBioPage}>
                          <input type="hidden" name="page_id" value={p.id} />
                          <button className="rounded-lg border border-accent px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent-soft">
                            Keep this one live
                          </button>
                        </form>
                      )}
                      <div className="text-right">
                        <p className="tabular text-sm font-semibold text-ink-900">
                          {formatNumber(p.views)}
                        </p>
                        <p className="text-[11px] text-ink-400">views</p>
                      </div>
                      {isLive || !overLimit ? (
                        <a
                          href={`/@${p.handle}`}
                          target="_blank"
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          View ↗
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-ink-300">
                          View ↗
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-6 py-12 text-center text-sm text-ink-500">
              No bio pages yet. Create one with the form on the left.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
