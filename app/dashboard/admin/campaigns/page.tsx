import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { Card, Badge } from "@/components/ui";
import { CopyUrlButton } from "@/components/CopyUrlButton";
import { CAMPAIGN_PAGES, campaignUrl } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

const categoryTone: Record<string, string> = {
  Vertical: "indigo",
  Campaign: "green",
  Ambassador: "violet",
};

export default async function AdminCampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Campaign Pages
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Every landing and campaign page that lives outside the main site nav,
          in one place.
        </p>
      </div>

      <Card>
        <ul className="divide-y divide-ink-100">
          {CAMPAIGN_PAGES.map((c) => {
            const url = campaignUrl(c.path);
            return (
              <li
                key={c.path}
                className="flex flex-wrap items-center gap-4 px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                    {c.title}
                    <Badge tone={categoryTone[c.category] ?? "gray"}>
                      {c.category}
                    </Badge>
                    {c.visibility === "unlisted" && (
                      <Badge tone="gray">Unlisted</Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-500">{c.description}</p>
                  <p className="mt-1 truncate font-mono text-xs text-ink-400">
                    {url}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <CopyUrlButton url={url} />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-ink-50"
                  >
                    View ↗
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-ink-400">
        {CAMPAIGN_PAGES.length}{" "}
        {CAMPAIGN_PAGES.length === 1 ? "page" : "pages"}. New landers added to the
        registry show up here automatically.
      </p>
    </div>
  );
}
