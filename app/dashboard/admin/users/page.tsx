import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { Card, Badge } from "@/components/ui";
import { startImpersonation } from "../actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const planTone: Record<string, string> = {
  agency: "violet",
  growth: "indigo",
  starter: "indigo",
  free: "gray",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const ql = q.toLowerCase();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) notFound();

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const allUsers = usersData?.users ?? [];

  const { data: wsRows } = await admin
    .from("workspaces")
    .select("id, owner_id, plan, comp");
  const planByOwner = new Map(
    (wsRows ?? []).map((w) => [
      w.owner_id as string,
      { plan: (w.plan as string) ?? "free", comp: Boolean(w.comp) },
    ])
  );
  // workspace_id -> owner_id, so activity keyed by workspace rolls up to a user.
  const ownerByWs = new Map<string, string>(
    (wsRows ?? []).map((w) => [w.id as string, w.owner_id as string])
  );
  const adminIds = new Set(
    allUsers.filter((u) => isAdmin(u.email)).map((u) => u.id)
  );

  // At-a-glance activity: how many codes, bio pages, and leads each user has.
  // Each row is just a workspace_id, so these payloads stay small.
  async function countByOwner(table: string): Promise<Map<string, number>> {
    const { data } = await admin.from(table).select("workspace_id").limit(100000);
    const m = new Map<string, number>();
    for (const r of data ?? []) {
      const owner = ownerByWs.get(r.workspace_id as string);
      if (!owner) continue;
      m.set(owner, (m.get(owner) ?? 0) + 1);
    }
    return m;
  }
  const [codesByOwner, biosByOwner, leadsByOwner] = await Promise.all([
    countByOwner("codes"),
    countByOwner("bio_pages"),
    countByOwner("leads"),
  ]);

  let list = allUsers;
  if (ql) list = list.filter((u) => (u.email ?? "").toLowerCase().includes(ql));
  list = [...list].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE;
  const pageUsers = list.slice(from, from + PAGE_SIZE);

  const pageHref = (p: number) =>
    `/dashboard/admin/users?${new URLSearchParams({
      ...(q ? { q } : {}),
      page: String(p),
    }).toString()}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/admin"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
          Users
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Search every account and log in as any user to help or diagnose.
        </p>
      </div>

      <form method="get" className="mb-5 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by email…"
          autoCapitalize="none"
          className="min-h-[44px] flex-1 rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none focus:border-accent-ring focus:ring-2 focus:ring-accent-ring/30"
        />
        <button className="min-h-[44px] rounded-xl bg-ink-900 px-5 text-sm font-semibold text-white transition hover:bg-ink-800">
          Search
        </button>
        {q && (
          <Link
            href="/dashboard/admin/users"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-ink-200 px-4 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            Clear
          </Link>
        )}
      </form>

      <Card>
        <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-ink-900">
            {q ? `Results for “${q}”` : "All users"}
          </h2>
          <span className="text-xs text-ink-400">
            {total} {total === 1 ? "user" : "users"}
            {total > 0 ? ` · page ${page} of ${totalPages}` : ""}
          </span>
        </div>

        {pageUsers.length > 0 ? (
          <ul className="divide-y divide-ink-100">
            {pageUsers.map((u) => {
              const info = planByOwner.get(u.id);
              const plan = info?.comp ? "comp" : info?.plan ?? "free";
              const codeN = codesByOwner.get(u.id) ?? 0;
              const bioN = biosByOwner.get(u.id) ?? 0;
              const leadN = leadsByOwner.get(u.id) ?? 0;
              const hasActivity = codeN > 0 || bioN > 0 || leadN > 0;
              const plural = (n: number, s: string) =>
                `${n} ${s}${n === 1 ? "" : "s"}`;
              return (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 px-6 py-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">
                      {u.email}
                    </p>
                    <p className="text-xs text-ink-400">
                      Joined{" "}
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {hasActivity ? (
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span
                          className={
                            codeN > 0
                              ? "font-medium text-ink-700"
                              : "text-ink-300"
                          }
                        >
                          {plural(codeN, "code")}
                        </span>
                        <span className="text-ink-200">·</span>
                        <span
                          className={
                            bioN > 0 ? "font-medium text-ink-700" : "text-ink-300"
                          }
                        >
                          {plural(bioN, "page")}
                        </span>
                        <span className="text-ink-200">·</span>
                        <span
                          className={
                            leadN > 0
                              ? "font-medium text-emerald-600"
                              : "text-ink-300"
                          }
                        >
                          {plural(leadN, "lead")}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-1 text-xs italic text-ink-300">
                        No activity yet
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={info?.comp ? "green" : planTone[plan] ?? "gray"}>
                      {plan}
                    </Badge>
                    {adminIds.has(u.id) ? (
                      <span className="text-xs text-ink-400">admin</span>
                    ) : (
                      <form action={startImpersonation}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <button className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-ink-50">
                          Log in as
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-6 py-12 text-center text-sm text-ink-500">
            {q ? "No users match that search." : "No users yet."}
          </p>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-ink-100 px-6 py-3.5">
            <span className="text-xs text-ink-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
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
                  href={pageHref(page + 1)}
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
      </Card>
    </div>
  );
}
