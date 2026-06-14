import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge } from "@/components/ui";
import { CreateBioForm } from "@/components/CreateBioForm";
import { formatNumber } from "@/lib/utils";
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

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
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
              {list.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <Link href={`/dashboard/bio/${p.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {p.display_name || p.handle}
                    </p>
                    <p className="truncate text-xs text-ink-400">@{p.handle}</p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="tabular text-sm font-semibold text-ink-900">
                        {formatNumber(p.views)}
                      </p>
                      <p className="text-[11px] text-ink-400">views</p>
                    </div>
                    <a
                      href={`/@${p.handle}`}
                      target="_blank"
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      View ↗
                    </a>
                  </div>
                </li>
              ))}
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
