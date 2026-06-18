import Link from "next/link";
import { Card } from "@/components/ui";

type Props = {
  hasCode: boolean;
  hasScan: boolean;
  hasBio: boolean;
  hasLead: boolean;
};

type Step = {
  label: string;
  desc: string;
  href: string;
  cta: string;
  done: boolean;
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// Progress-tracked activation checklist. Reads live workspace state, checks each
// step off automatically, and hides itself once the user has activated. Shows a
// single primary CTA on the next incomplete step to keep focus.
export function OnboardingChecklist({ hasCode, hasScan, hasBio, hasLead }: Props) {
  const steps: Step[] = [
    {
      label: "Create your first QR code",
      desc: "Point it anywhere. With TRAXXR you can change where it goes later, even after it's printed.",
      href: "/dashboard/codes",
      cta: "Create a code",
      done: hasCode,
    },
    {
      label: "See it work, get your first scan",
      desc: "Open your code and scan the QR with your phone. Watch it show up in real time.",
      href: "/dashboard/codes",
      cta: "View your codes",
      done: hasScan,
    },
    {
      label: "Publish your link-in-bio page",
      desc: "One link for everything you do, with its own QR code and analytics.",
      href: "/dashboard/bio",
      cta: "Build your page",
      done: hasBio,
    },
    {
      label: "Capture your first lead",
      desc: "Turn a code or page into a sign-up form and start growing your list.",
      href: "/dashboard/codes",
      cta: "Set up lead capture",
      done: hasLead,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null; // fully activated, get out of the way

  const nextIndex = steps.findIndex((s) => !s.done);
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <Card className="mb-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">
            Get started with TRAXXR
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">
            A few quick steps to your first tracked scan.
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-ink-700">
          {completed} of {steps.length}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-5 space-y-4">
        {steps.map((s, i) => {
          const isNext = i === nextIndex;
          return (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={
                  s.done
                    ? "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"
                    : "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink-200 text-transparent"
                }
              >
                <CheckIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={
                    s.done
                      ? "text-sm font-medium text-ink-400 line-through"
                      : "text-sm font-medium text-ink-900"
                  }
                >
                  {s.label}
                </p>
                {isNext && (
                  <>
                    <p className="mt-0.5 text-sm text-ink-500">{s.desc}</p>
                    <Link href={s.href} className="mt-2 inline-block">
                      <span className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-800">
                        {s.cta}
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
