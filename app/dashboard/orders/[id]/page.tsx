import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { formatUsd } from "@/lib/print/catalog";
import { orderStatusLabel } from "@/lib/admin";
import { decalFromOptions } from "@/lib/print/decal";
import { DecalPreview } from "@/components/DecalPreview";
import { approveProof, requestProofChange } from "../actions";

export const dynamic = "force-dynamic";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com"
).replace(/\/$/, "");

export default async function ProofPage({
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

  const { data: order } = await supabase
    .from("print_orders")
    .select(
      "id, product_name, options, quantity, total_cents, status, code_id, tracking_number, tracking_url, proof_note, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  // Build the same composed proof the shop will print.
  let codeHref = "";
  if (order.code_id) {
    const { data: code } = await supabase
      .from("codes")
      .select("slug, design_svg")
      .eq("id", order.code_id)
      .maybeSingle();
    if (code?.design_svg) {
      codeHref = `data:image/svg+xml;utf8,${encodeURIComponent(
        code.design_svg as string
      )}`;
    } else if (code?.slug) {
      codeHref = `${APP_URL}/api/qr/${code.slug}`;
    }
  }
  const decal = decalFromOptions(
    order.options as Record<string, unknown> | null
  );

  const opts = order.options as { size?: string; finish?: string } | null;
  const needsReview =
    order.status === "proof_ready" || order.status === "changes_requested";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/orders"
        className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-700"
      >
        ← All orders
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {needsReview ? "Approve your proof" : "Your proof"}
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          This is exactly what we will print. Check the code, colors, and any
          text, then approve to send it to production.
        </p>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-6">
        <div className="grid aspect-square w-full place-items-center rounded-xl bg-ink-50 p-8">
          <DecalPreview
            codeHref={codeHref}
            options={decal}
            className="w-full max-w-[340px]"
          />
        </div>

        <div className="mt-4">
          <p className="font-semibold text-ink-900">{order.product_name}</p>
          <p className="mt-0.5 text-sm text-ink-500">
            {[opts?.size, opts?.finish].filter(Boolean).join(" · ")} ·{" "}
            {order.quantity} units · {formatUsd(order.total_cents)}
          </p>
        </div>

        {needsReview ? (
          <div className="mt-5 space-y-4">
            <form action={approveProof}>
              <input type="hidden" name="id" value={order.id} />
              <Button type="submit">Approve and send to print</Button>
            </form>

            <form
              action={requestProofChange}
              className="rounded-xl border border-ink-200 p-4"
            >
              <input type="hidden" name="id" value={order.id} />
              <p className="text-sm font-medium text-ink-800">
                Need a change?
              </p>
              <textarea
                name="note"
                rows={2}
                maxLength={500}
                placeholder="Tell us what to adjust and we will sort it out before printing."
                className="mt-2 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-accent focus:outline-none"
              />
              <button className="mt-2 text-sm font-medium text-ink-500 underline-offset-2 hover:text-ink-700 hover:underline">
                Request a change
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
            Status: {orderStatusLabel(order.status)}.
            {order.tracking_number ? (
              <>
                {" "}
                Tracking:{" "}
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent hover:underline"
                  >
                    {order.tracking_number}
                  </a>
                ) : (
                  order.tracking_number
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
