import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Button } from "@/components/ui";
import { BioSettingsForm } from "@/components/BioSettingsForm";
import { BioLinksList } from "@/components/BioLinksList";
import { CopyUrlButton } from "@/components/CopyUrlButton";
import { BioBlockComposer } from "@/components/BioBlockComposer";
import { backfillBioFavicons } from "@/app/dashboard/bio/actions";
import { formatNumber } from "@/lib/utils";
import type { BioPage, BioLink } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  const bioBase = (
    process.env.NEXT_PUBLIC_BIO_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://traxxr.com"
  ).replace(/\/$/, "");
  const publicUrl = `${bioBase}/@${page.handle}`;
  // preview=1 stops the iframe from logging a view; v= busts cache so the
  // preview refreshes on every save.
  const previewSrc = `/@${page.handle}?preview=1&v=${Date.now()}`;

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
            traxxr.com/@{page.handle} · {formatNumber(page.views)} views
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyUrlButton url={publicUrl} />
          <Link href={`/dashboard/bio/${page.id}/analytics`}>
            <Button variant="secondary">Analytics</Button>
          </Link>
          <a href={`/@${page.handle}`} target="_blank">
            <Button variant="secondary">View page ↗</Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Editing column */}
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

          <BioBlockComposer pageId={page.id} />

          <Card>
            <CardHeader
              title="Blocks"
              subtitle={`${links.length} on the page · drag to reorder`}
              action={
                <form action={backfillBioFavicons}>
                  <input type="hidden" name="page_id" value={page.id} />
                  <button className="shrink-0 text-xs font-medium text-accent hover:underline">
                    Pull missing link icons
                  </button>
                </form>
              }
            />
            <BioLinksList
              key={links
                .map((l) => `${l.id}:${l.hidden ? 1 : 0}:${l.title}:${l.url}`)
                .sort()
                .join("|")}
              links={links}
              pageId={page.id}
            />
          </Card>
        </div>

        {/* Live preview */}
        <div>
          <div className="lg:sticky lg:top-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
              Live preview
            </p>
            <div className="mx-auto w-[380px] max-w-full overflow-hidden rounded-[2.25rem] border-[10px] border-ink-900 bg-white shadow-cardHover">
              <iframe
                key={previewSrc}
                src={previewSrc}
                title="Live preview of your bio page"
                className="block h-[700px] w-full border-0"
              />
            </div>
            <p className="mt-2 text-center text-xs text-ink-400">
              Refreshes each time you save a change.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
