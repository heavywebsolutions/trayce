"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { startCheckout, applyCode } from "@/app/dashboard/billing/actions";

const TIERS = [
  { v: "starter", label: "Starter", price: "$9.95" },
  { v: "growth", label: "Growth", price: "$19.95" },
  { v: "agency", label: "Agency", price: "$59.95" },
] as const;

// Plan button with a built-in redirecting state, so clicking it gives immediate
// feedback instead of a dead beat before Stripe Checkout opens.
function CheckoutButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50 disabled:opacity-60"
    >
      {pending ? "Redirecting to checkout…" : label}
    </button>
  );
}

// Upgrade UI for a free / trialing account. One code field handles BOTH a
// free-access (comp) code, redeemed instantly, and a percent/dollar discount
// code, which is validated here and carried into Stripe Checkout when a plan is
// chosen. The field sits above the plan buttons.
export function UpgradePlans() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountCode, setDiscountCode] = useState(""); // validated discount, carried to checkout
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function apply() {
    const value = code.trim();
    if (!value) return;
    setStatus(null);
    startTransition(async () => {
      const res = await applyCode(value);
      if (!res.ok) {
        setDiscountCode("");
        setStatus({ ok: false, msg: res.error ?? "That code isn't valid." });
        return;
      }
      if (res.kind === "comp") {
        setStatus({ ok: true, msg: "Code applied. Updating your plan…" });
        router.refresh();
      } else {
        setDiscountCode(value);
        setStatus({
          ok: true,
          msg: "Discount applied. It'll come off at checkout.",
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* One code field, above the plans */}
      <div className="max-w-sm">
        <label className="mb-1 block text-xs font-medium text-ink-400">
          Promo or discount code (optional)
        </label>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (discountCode) setDiscountCode("");
              if (status) setStatus(null);
            }}
            placeholder="Enter a code"
            autoCapitalize="characters"
            className="min-h-[40px] flex-1 rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
          />
          <button
            type="button"
            onClick={apply}
            disabled={pending || !code.trim()}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50 disabled:opacity-60"
          >
            {pending ? "Checking…" : "Apply"}
          </button>
        </div>
        {status && (
          <p
            className={`mt-1 text-xs ${
              status.ok ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {status.msg}
          </p>
        )}
        <p className="mt-1 text-[11px] text-ink-400">
          Have a code? Enter it and we&apos;ll apply it.
        </p>
      </div>

      {/* Plans */}
      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map((t) => (
          <form key={t.v} action={startCheckout}>
            <input type="hidden" name="plan" value={t.v} />
            <input type="hidden" name="promo" value={discountCode} />
            <CheckoutButton label={`Upgrade to ${t.label} · ${t.price}/mo`} />
          </form>
        ))}
      </div>
    </div>
  );
}
