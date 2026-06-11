import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, Button, Input } from "@/components/ui";
import { BioSettingsForm } from "@/components/BioSettingsForm";
import { LinkThumb } from "@/components/LinkThumb";
import {
  addBioLink,
  updateBioLink,
  deleteBioLink,
  moveBioLink,
} from "@/app/dashboard/bio/actions";
import { formatNumber } from "@/lib/utils";
import type { BioPage, BioLink } from "@/lib/types";

export const dynamic = "force-dynamic";

const kindTone: Record<string, string> = {
  link: "indigo",
  header: "gray",
  video: "violet",
};

export default async function BioEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pageRow } = await supabase
    .from("bio_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!pageRow) notFound();
  const page = pageRow as BioPage;

  const { data: linkRows } = await supabase
    .from("bio_links")
    .select("*")
    .eq("page_id", id)
    .order("position", { ascending: true });
  const links = (linkRows ?? []) as BioLink[];

  const { count: subCount } = await supabase
    .from("bio_subscribers")
    .select("*", { count: "exact", head: true })
    .eq("page_id", id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/bio"
        className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-700"
      >
        ← All bio pages
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {page.display_name || page.handle}
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">
            /p/{page.handle} · {formatNumber(page.views)} views
          </p>
        </div>
        <a href={`/p/${page.handle}`} target="_blank">
          <Button variant="secondary">View page ↗</Button>
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Page settings + QR/subscribers */}
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Page QR
                </p>
                <a
                  href={`/api/bio/qr/${page.handle}?dl=1`}
                  className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
                >
                  Download QR
                </a>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-400">
                  Subscribers
                </p>
                <p className="tabular mt-1 text-2xl font-semibold text-ink-900">
                  {formatNumber(subCount ?? 0)}
                </p>
                {(subCount ?? 0) > 0 && (
                  <a
                    href={`/api/bio/${page.id}/subscribers.csv`}
                    className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
                  >
                    Download CSV
                  </a>
                )}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/bio/qr/${page.handle}`}
                alt="Bio page QR"
                className="h-24 w-24 shrink-0 rounded-lg border border-ink-100"
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-ink-900">
              Page settings
            </h2>
            <BioSettingsForm page={page} />
          </Card>
        </div>

        {/* Links */}
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink-900">Add a block</h2>
            <form action={addBioLink} className="mt-3 space-y-2.5">
              <input type="hidden" name="page_id" value={page.id} />
              <select
                name="kind"
                defaultValue="link"
                className="min-h-[44px] w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
              >
                <option value="link">Link button</option>
                <option value="header">Section header</option>
                <option value="video">YouTube video</option>
                <option value="subscribe">Email subscribe</option>
              </select>
              <Input name="title" placeholder="Title (e.g. Arctic Cat Wraps)" />
              <Input name="url" placeholder="https://… (URL or YouTube link)" />
              <Button type="submit" variant="secondary">
                Add block
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Blocks" subtitle={`${links.length} on the page`} />
            {links.length > 0 ? (
              <ul className="divide-y divide-ink-100">
                {links.map((l, i) => (
                  <li key={l.id} className="px-6 py-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge tone={kindTone[l.kind] ?? "gray"}>{l.kind}</Badge>
                      <div className="flex items-center gap-1">
                        {l.kind === "link" && (
                          <span className="mr-1 text-xs text-ink-400">
                            {formatNumber(l.clicks)} clicks
                          </span>
                        )}
                        <form action={moveBioLink}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="page_id" value={page.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button
                            disabled={i === 0}
                            className="rounded px-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveBioLink}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="page_id" value={page.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button
                            disabled={i === links.length - 1}
                            className="rounded px-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </form>
                        <form action={deleteBioLink}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="page_id" value={page.id} />
                          <button className="rounded px-1.5 text-rose-500 hover:bg-rose-50">
                            ✕
                          </button>
                        </form>
                      </div>
                    </div>
                    <form action={updateBioLink} className="flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="page_id" value={page.id} />
                      <Input
                        name="title"
                        defaultValue={l.title}
                        placeholder="Title"
                        className="flex-1"
                      />
                      {l.kind !== "header" && (
                        <Input
                          name="url"
                          defaultValue={l.url}
                          placeholder="URL"
                          className="flex-1"
                        />
                      )}
                      <Button type="submit" variant="secondary">
                        Save
                      </Button>
                    </form>
                    {l.kind === "link" && (
                      <LinkThumb
                        linkId={l.id}
                        pageId={page.id}
                        initial={l.thumbnail_url}
                      />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-8 text-center text-sm text-ink-500">
                No blocks yet. Add your first link above.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
