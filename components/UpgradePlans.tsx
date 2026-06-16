"use client";

import { useState } from "react";
import { startCheckout } from "@/app/dashboard/billing/actions";

const TIERS = [
  { v: "starter", label: "Starter", price: "$9.95" },
  { v: "growth", label: "Growth", price: "$19.95" },
  { v: "agency", label: "Agency", price: "$59.95" },
] as const;

// Upgrade buttons for a free account, with an optional discount-code field that
// is passed into Stripe Checkout. The code is validated server-side.
export function UpgradePlans() {
  const [promo, setPromo] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map((t) => (
          <form key={t.v} action={startCheckout}>
            <input type="hidden" name="plan" value={t.v} />
            <input type="hidden" name="promo" value={promo} />
            <button className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50">
              Upgrade to {t.label} · {t.price}/mo
            </button>
          </form>
        ))}
      </div>
      <div className="max-w-xs">
        <label className="mb-1 block text-xs font-medium text-ink-400">
          Discount code (optional)
        </label>
        <input
          value={promo}
          onChange={(e) => setPromo(e.target.value.toUpperCase())}
          placeholder="Enter a code"
          autoCapitalize="characters"
          className="min-h-[40px] w-full rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
        />
        <p className="mt-1 text-[11px] text-ink-400">
          Applied at checkout. Free-access codes go in the box below instead.
        </p>
      </div>
    </div>
  );
}
