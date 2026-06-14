import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRINT_PRODUCTS, formatUsd } from "@/lib/print/catalog";

export const dynamic = "force-dynamic";

export default async function PrintCatalogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Print &amp; Ship
          </h1>
          <p className="mt-0.5 max-w-xl text-sm text-ink-500">
            Order your codes as real decals, printed in our own production house
            on professional equipment and shipped to your door.
          </p>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-sm font-medium text-accent hover:underline"
        >
          My orders
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PRINT_PRODUCTS.map((p) => {
          const from = Math.min(...p.tiers.map((t) => t.unitPriceCents));
          return (
            <Link
              key={p.key}
              href={`/dashboard/print/${p.key}`}
              className="group flex flex-col rounded-2xl border border-ink-200 bg-white p-6 transition hover:border-ink-300 hover:shadow-card"
            >
              <h2 className="text-base font-semibold text-ink-900">{p.name}</h2>
              <p className="mt-1 flex-1 text-sm text-ink-500">{p.blurb}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-ink-600">
                  From {formatUsd(from)} each
                </span>
                <span className="text-sm font-medium text-accent">
                  Configure →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-ink-400">
        Custom sizes, banners, and large-format jobs are coming soon as a quick
        quote. For now, choose a productized option above.
      </p>
    </div>
  );
}
