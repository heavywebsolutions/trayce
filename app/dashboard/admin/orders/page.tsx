import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin, orderStatusLabel } from "@/lib/admin";
import { formatUsd, LOGO_PREP_LABEL } from "@/lib/print/catalog";
import { markPrinting, markShipped } from "./actions";

export const dynamic = "force-dynamic";

type Addr = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};
type Order = {
  id: string;
  product_name: string;
  options: {
    size?: string;
    finish?: string;
    logo_prep?: string;
    prep_source?: string;
  } | null;
  quantity: number;
  total_cents: number;
  status: string;
  tracking_number: string | null;
  shipping: { name?: string | null; address?: Addr | null } | null;
  proof_note: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  proof_ready: "bg-accent-soft text-accent",
  changes_requested: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  printing: "bg-amber-50 text-amber-700",
  shipped: "bg-emerald-50 text-emerald-700",
};

export default async function FulfillmentQueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Hide the page's existence from non-admins.
  if (!isAdmin(user.email)) notFound();

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("print_orders")
    .select(
      "id, product_name, options, quantity, total_cents, status, tracking_number, shipping, proof_note, created_at"
    )
    .in("status", [
      "proof_ready",
      "changes_requested",
      "approved",
      "printing",
      "shipped",
    ])
    .order("created_at", { ascending: false })
    .limit(200);
  const orders = (rows ?? []) as Order[];

  const awaiting = orders.filter(
    (o) => o.status === "proof_ready" || o.status === "changes_requested"
  );
  const queue = orders.filter(
    (o) => o.status === "approved" || o.status === "printing"
  );
  const shipped = orders.filter((o) => o.status === "shipped");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Fulfillment queue
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Internal back office. Approved orders are ready to print and ship.
        </p>
      </div>

      {awaiting.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
            Awaiting customer approval
          </h2>
          <div className="mb-10 space-y-3">
            {awaiting.map((o) => (
              <OrderCard key={o.id} o={o} />
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
        Ready to print
      </h2>
      {queue.length === 0 ? (
        <div className="mb-10 rounded-2xl border border-ink-200 bg-white p-10 text-center text-sm text-ink-500">
          Nothing approved yet. Orders land here once the customer approves their
          proof.
        </div>
      ) : (
        <div className="mb-10 space-y-3">
          {queue.map((o) => (
            <OrderCard key={o.id} o={o} />
          ))}
        </div>
      )}

      {shipped.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
            Recently shipped
          </h2>
          <div className="space-y-3">
            {shipped.map((o) => (
              <OrderCard key={o.id} o={o} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrderCard({ o }: { o: Order }) {
  const a = o.shipping?.address;
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900">
            {o.product_name}{" "}
            <span className="font-normal text-ink-500">
              · {[o.options?.size, o.options?.finish].filter(Boolean).join(" / ")}{" "}
              · {o.quantity} units · {formatUsd(o.total_cents)}
            </span>
          </p>
          <p className="mt-1 text-sm text-ink-600">
            {o.shipping?.name || "No name"}
          </p>
          {a && (
            <p className="text-xs text-ink-400">
              {[a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {o.proof_note && (
            <p className="mt-1 text-xs text-amber-700">
              Change requested: {o.proof_note}
            </p>
          )}
          {o.options?.logo_prep === "true" && (
            <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
              {LOGO_PREP_LABEL}
            </span>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            STATUS_STYLES[o.status] ?? "bg-ink-100 text-ink-500"
          }`}
        >
          {orderStatusLabel(o.status)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <a
          href={`/api/print/${o.id}`}
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50"
        >
          Download print file
        </a>
        {o.options?.prep_source && (
          <a
            href={o.options.prep_source}
            download={`logo-source-${o.id.slice(0, 8)}`}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50"
          >
            Download logo source
          </a>
        )}

        {o.status === "approved" && (
          <form action={markPrinting}>
            <input type="hidden" name="id" value={o.id} />
            <button className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover">
              Mark printing
            </button>
          </form>
        )}

        {o.status === "printing" && (
          <form action={markShipped} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={o.id} />
            <input
              name="tracking"
              placeholder="Tracking number"
              className="min-h-[40px] rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
            />
            <input
              name="tracking_url"
              placeholder="Tracking URL (optional)"
              className="min-h-[40px] rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
            />
            <button className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover">
              Mark shipped
            </button>
          </form>
        )}

        {o.status === "shipped" && o.tracking_number && (
          <span className="text-sm text-ink-500">
            Tracking: {o.tracking_number}
          </span>
        )}
      </div>
    </div>
  );
}
