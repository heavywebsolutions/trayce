import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatUsd } from "@/lib/print/catalog";
import { orderStatusLabel } from "@/lib/admin";
import { reorderPrint } from "@/app/dashboard/print/actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-accent-soft text-accent",
  proof_ready: "bg-accent-soft text-accent",
  approved: "bg-emerald-50 text-emerald-700",
  changes_requested: "bg-amber-50 text-amber-700",
  printing: "bg-amber-50 text-amber-700",
  shipped: "bg-emerald-50 text-emerald-700",
  canceled: "bg-ink-100 text-ink-500",
  pending: "bg-ink-100 text-ink-500",
};

type Order = {
  id: string;
  product_name: string;
  options: { size?: string; finish?: string } | null;
  quantity: number;
  total_cents: number;
  status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; approved?: string; change?: string }>;
}) {
  const { ok, approved, change } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("print_orders")
    .select(
      "id, product_name, options, quantity, total_cents, status, tracking_number, tracking_url, created_at"
    )
    .neq("status", "pending")
    .order("created_at", { ascending: false });
  const orders = (rows ?? []) as Order[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            My orders
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Your printed products and where they are in production.
          </p>
        </div>
        <Link
          href="/dashboard/print"
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Order prints
        </Link>
      </div>

      {ok && (
        <div className="mb-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          Payment received. Your proof is ready, review and approve it below
          before we print.
        </div>
      )}
      {approved && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Proof approved. It is headed to production.
        </div>
      )}
      {change && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Got it. We will review your change and follow up before printing.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center">
          <p className="text-sm text-ink-600">No orders yet.</p>
          <Link
            href="/dashboard/print"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Browse Print &amp; Ship →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-ink-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-900">{o.product_name}</p>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {[o.options?.size, o.options?.finish]
                      .filter(Boolean)
                      .join(" · ")}
                    {o.options?.size || o.options?.finish ? " · " : ""}
                    {o.quantity} units · {formatUsd(o.total_cents)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    STATUS_STYLES[o.status] ?? STATUS_STYLES.pending
                  }`}
                >
                  {orderStatusLabel(o.status)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
                <span>
                  {new Date(o.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {o.status === "proof_ready" ||
                o.status === "changes_requested" ? (
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className="font-semibold text-accent hover:underline"
                  >
                    Review proof →
                  </Link>
                ) : o.tracking_number ? (
                  o.tracking_url ? (
                    <a
                      href={o.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      Track: {o.tracking_number} ↗
                    </a>
                  ) : (
                    <span className="text-ink-500">
                      Tracking: {o.tracking_number}
                    </span>
                  )
                ) : (
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className="text-ink-400 hover:text-ink-600"
                  >
                    View
                  </Link>
                )}
              </div>
              <div className="mt-3 border-t border-ink-100 pt-3">
                <form action={reorderPrint}>
                  <input type="hidden" name="order_id" value={o.id} />
                  <button className="text-sm font-semibold text-accent hover:underline">
                    Reorder →
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
