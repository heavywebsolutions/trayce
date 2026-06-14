"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import {
  pauseSubscription,
  cancelSubscription,
} from "@/app/dashboard/billing/actions";

type Usage = { leads: number; scans: number; codes: number; bioPages: number };
type Lower = { key: string; label: string; price: string } | null;

const REASONS = [
  { key: "expensive", label: "It is too expensive right now" },
  { key: "not_using", label: "I am not using it enough" },
  { key: "break", label: "I just need a break" },
  { key: "missing_feature", label: "It is missing something I need" },
  { key: "technical", label: "I ran into a technical problem" },
  { key: "other", label: "Something else" },
];

export function CancelFlow({
  planLabel,
  usage,
  loseList,
  lowerPlan,
}: {
  planLabel: string;
  usage: Usage;
  loseList: string[];
  lowerPlan: Lower;
}) {
  const [step, setStep] = useState<"reason" | "offer">("reason");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const stats = [
    { n: usage.scans, label: "scans tracked" },
    { n: usage.leads, label: "leads captured" },
    { n: usage.codes, label: "codes created" },
    { n: usage.bioPages, label: "bio pages built" },
  ].filter((s) => s.n > 0);

  const ValueRecap =
    stats.length > 0 ? (
      <div className="rounded-xl border border-ink-200 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
          What you have built on {planLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-semibold tabular-nums text-ink-900">
                {s.n.toLocaleString()}
              </p>
              <p className="text-xs text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  const PauseOffer = (
    <div className="rounded-xl border-2 border-accent bg-accent-soft p-4">
      <p className="text-sm font-semibold text-ink-900">Take a break instead</p>
      <p className="mt-1 text-sm text-ink-600">
        Pause billing and pick up right where you left off. Nothing is deleted,
        and you are not charged while paused.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 2, 3].map((m) => (
          <form key={m} action={pauseSubscription}>
            <input type="hidden" name="months" value={m} />
            <input type="hidden" name="reason" value={reason} />
            <button className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover">
              Pause {m} month{m > 1 ? "s" : ""}
            </button>
          </form>
        ))}
      </div>
    </div>
  );

  function renderOffer() {
    if (reason === "expensive" && lowerPlan) {
      return (
        <>
          <div className="rounded-xl border-2 border-accent bg-accent-soft p-4">
            <p className="text-sm font-semibold text-ink-900">
              Switch to a lighter plan
            </p>
            <p className="mt-1 text-sm text-ink-600">
              Keep your codes and pages working for less. {lowerPlan.label} is{" "}
              {lowerPlan.price}/mo.
            </p>
            <Link
              href={`/dashboard/settings/change?plan=${lowerPlan.key}`}
              className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Switch to {lowerPlan.label} · {lowerPlan.price}/mo
            </Link>
          </div>
          <p className="text-sm text-ink-500">Or take a break:</p>
          {PauseOffer}
        </>
      );
    }
    if (reason === "technical") {
      return (
        <div className="rounded-xl border-2 border-accent bg-accent-soft p-4">
          <p className="text-sm font-semibold text-ink-900">
            Let us try to fix it first
          </p>
          <p className="mt-1 text-sm text-ink-600">
            Most issues are quick to sort out. Tell us what happened and we will
            jump on it before you go.
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Contact support
          </Link>
        </div>
      );
    }
    if (reason === "missing_feature") {
      return (
        <div className="rounded-xl border border-ink-200 p-4">
          <p className="text-sm font-semibold text-ink-900">
            What were you missing?
          </p>
          <p className="mt-1 text-sm text-ink-600">
            We read every one of these, and it directly shapes what we build
            next.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="The feature or integration you needed..."
            className="mt-3 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-accent focus:outline-none"
          />
        </div>
      );
    }
    // not_using, break, other
    return PauseOffer;
  }

  if (step === "reason") {
    return (
      <div className="space-y-5">
        {ValueRecap}
        <div>
          <p className="text-sm font-medium text-ink-800">
            Before you go, what is prompting this?
          </p>
          <div className="mt-3 grid gap-2">
            {REASONS.map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  setReason(r.key);
                  setStep("offer");
                }}
                className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 text-left text-sm text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
              >
                <span>{r.label}</span>
                <span aria-hidden className="text-ink-300">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-block text-sm font-medium text-ink-500 hover:text-ink-700"
        >
          Never mind, keep my plan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {renderOffer()}

      <div className="rounded-xl border border-ink-200 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
          If you cancel, you lose
        </p>
        <ul className="mt-3 space-y-2">
          {loseList.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2.5 text-sm text-ink-400"
            >
              <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-ink-300" />
              <span className="line-through decoration-ink-300">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Link href="/dashboard/settings">
          <Button>Keep my plan</Button>
        </Link>
        <form action={cancelSubscription}>
          <input type="hidden" name="reason" value={reason} />
          <input type="hidden" name="note" value={note} />
          <button className="text-sm font-medium text-red-600 underline-offset-2 hover:underline">
            Yes, cancel my subscription
          </button>
        </form>
      </div>

      <button
        onClick={() => setStep("reason")}
        className="text-xs text-ink-400 hover:text-ink-600"
      >
        ← Back
      </button>
    </div>
  );
}
