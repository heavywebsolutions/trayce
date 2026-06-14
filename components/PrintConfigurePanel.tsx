"use client";

import { useState } from "react";
import Link from "next/link";
import { createPrintCheckout } from "@/app/dashboard/print/actions";
import { priceFor, formatUsd, type PrintProduct } from "@/lib/print/catalog";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type Code = { id: string; title: string | null; slug: string };

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[40px] rounded-xl border px-3.5 text-sm font-medium transition",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50"
      )}
    >
      {children}
    </button>
  );
}

export function PrintConfigurePanel({
  product,
  codes,
}: {
  product: PrintProduct;
  codes: Code[];
}) {
  const [sizeKey, setSizeKey] = useState(product.sizes[0].key);
  const [finishKey, setFinishKey] = useState(product.finishes[0].key);
  const [qty, setQty] = useState(product.tiers[0].qty);
  const [codeId, setCodeId] = useState(codes[0]?.id ?? "");

  const price = priceFor(product.key, sizeKey, finishKey, qty);
  const selected = codes.find((c) => c.id === codeId);

  if (codes.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center">
        <p className="text-sm text-ink-600">
          You need a QR code before you can print one.
        </p>
        <Link
          href="/dashboard/codes"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Create your first code
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Configuration */}
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Which code
          </p>
          <select
            value={codeId}
            onChange={(e) => setCodeId(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
          >
            {codes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || c.slug}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <Chip
                key={s.key}
                active={s.key === sizeKey}
                onClick={() => setSizeKey(s.key)}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Finish
          </p>
          <div className="flex flex-wrap gap-2">
            {product.finishes.map((f) => (
              <Chip
                key={f.key}
                active={f.key === finishKey}
                onClick={() => setFinishKey(f.key)}
              >
                {f.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Quantity
          </p>
          <div className="flex flex-wrap gap-2">
            {product.tiers.map((t) => {
              const each = priceFor(product.key, sizeKey, finishKey, t.qty);
              return (
                <Chip
                  key={t.qty}
                  active={t.qty === qty}
                  onClick={() => setQty(t.qty)}
                >
                  {t.qty}
                  {each && (
                    <span className="ml-1 text-xs opacity-70">
                      ({formatUsd(each.unitPriceCents)} ea)
                    </span>
                  )}
                </Chip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview + summary */}
      <div className="lg:sticky lg:top-6">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-400">
            Preview
          </p>
          <div className="grid aspect-square w-full place-items-center rounded-xl bg-ink-50 p-6">
            {selected ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/qr/${selected.slug}`}
                alt="Your code"
                className="h-full w-full max-w-[220px] object-contain"
              />
            ) : (
              <span className="text-sm text-ink-400">Pick a code</span>
            )}
          </div>

          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Each</dt>
              <dd className="font-medium tabular-nums text-ink-900">
                {price ? formatUsd(price.unitPriceCents) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Quantity</dt>
              <dd className="font-medium tabular-nums text-ink-900">{qty}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-1.5">
              <dt className="font-semibold text-ink-900">Subtotal</dt>
              <dd className="font-semibold tabular-nums text-ink-900">
                {price ? formatUsd(price.totalCents) : "—"}
              </dd>
            </div>
          </dl>

          <form action={createPrintCheckout} className="mt-4">
            <input type="hidden" name="product_key" value={product.key} />
            <input type="hidden" name="size" value={sizeKey} />
            <input type="hidden" name="finish" value={finishKey} />
            <input type="hidden" name="qty" value={qty} />
            <input type="hidden" name="code_id" value={codeId} />
            <button
              disabled={!price || !codeId}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to checkout{price ? ` · ${formatUsd(price.totalCents)}` : ""}
            </button>
          </form>

          <p className="mt-3 text-xs text-ink-400">
            Shipping and tax are calculated at checkout. Printed in our
            production house and shipped in 3 to 7 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
