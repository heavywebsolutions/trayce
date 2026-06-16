"use client";

import { useState } from "react";
import { createPromoCode } from "@/app/dashboard/admin/promos/actions";

const lbl = "mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400";
const inp =
  "min-h-[44px] w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900";
const sel =
  "min-h-[44px] w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900";

const PLANS = [
  { v: "starter", label: "Starter" },
  { v: "growth", label: "Growth" },
  { v: "agency", label: "Agency" },
];

export function PromoCreateForm() {
  const [kind, setKind] = useState<"comp" | "percent" | "amount">("comp");
  const [domain, setDomain] = useState<"subscription" | "print">("subscription");

  const isComp = kind === "comp";
  const isDiscount = !isComp;

  return (
    <div className="mb-6 rounded-2xl border border-ink-200 bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-ink-900">Create a code</h2>
      <form action={createPromoCode} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={lbl}>Code</label>
          <input
            name="code"
            required
            placeholder="AMBASSADOR25"
            autoCapitalize="characters"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Type</label>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className={sel}
          >
            <option value="comp">Full comp (free access)</option>
            <option value="percent">Percent off</option>
            <option value="amount">Amount off ($)</option>
          </select>
        </div>

        {/* COMP: which tiers it can grant */}
        {isComp && (
          <div className="sm:col-span-2">
            <label className={lbl}>Grants free access to (pick one or more)</label>
            <div className="flex flex-wrap gap-3">
              {PLANS.map((p) => (
                <label
                  key={p.v}
                  className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-700"
                >
                  <input
                    type="checkbox"
                    name="comp_plans"
                    value={p.v}
                    defaultChecked={p.v === "growth"}
                    className="accent-[#2587DE]"
                  />
                  {p.label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-400">
              Grants the highest tier checked, free. Subscription only, never
              usable on Print &amp; Ship.
            </p>
          </div>
        )}

        {/* DISCOUNT: value */}
        {kind === "percent" && (
          <div>
            <label className={lbl}>Percent off</label>
            <input
              name="percent_off"
              type="number"
              min={1}
              max={100}
              placeholder="15"
              className={inp}
            />
          </div>
        )}
        {kind === "amount" && (
          <div>
            <label className={lbl}>Amount off (USD)</label>
            <input
              name="amount_off"
              type="number"
              min={0.5}
              step="0.01"
              placeholder="5.00"
              className={inp}
            />
          </div>
        )}

        {/* DISCOUNT: domain */}
        {isDiscount && (
          <div>
            <label className={lbl}>Applies to</label>
            <select
              name="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value as typeof domain)}
              className={sel}
            >
              <option value="subscription">Subscription plans</option>
              <option value="print">Print &amp; Ship orders</option>
            </select>
          </div>
        )}

        {/* DISCOUNT + subscription: duration + which tiers */}
        {isDiscount && domain === "subscription" && (
          <>
            <div>
              <label className={lbl}>Duration</label>
              <select name="duration" defaultValue="once" className={sel}>
                <option value="once">One time (first payment)</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="forever">Forever (all payments)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>
                Valid for tiers (none checked = all tiers)
              </label>
              <div className="flex flex-wrap gap-3">
                {PLANS.map((p) => (
                  <label
                    key={p.v}
                    className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-700"
                  >
                    <input
                      type="checkbox"
                      name="applies_to_plans"
                      value={p.v}
                      className="accent-[#2587DE]"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className={lbl}>Label (optional)</label>
          <input name="label" placeholder="Founding ambassadors" className={inp} />
        </div>
        <div>
          <label className={lbl}>Max redemptions (blank = unlimited)</label>
          <input
            name="max_redemptions"
            type="number"
            min={1}
            placeholder="Unlimited"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Expires (optional)</label>
          <input name="expires_at" type="date" className={inp} />
        </div>

        <div className="flex items-end sm:col-span-2">
          <button className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover">
            Create code
          </button>
        </div>
      </form>
    </div>
  );
}
