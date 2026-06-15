import Link from "next/link";
import { loadEntitlements } from "@/lib/plan";

// Quiet countdown during the 14-day reverse trial. Renders nothing once the
// trial ends or for paid/comped accounts.
export async function TrialBanner() {
  const e = await loadEntitlements();
  if (!e || !e.trialing) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
      <span className="text-accent">
        <strong>
          {e.daysLeft} day{e.daysLeft === 1 ? "" : "s"} of Growth left.
        </strong>{" "}
        Editable codes, full analytics, and lead capture lock when your trial
        ends.
      </span>
      <Link
        href="/dashboard/settings"
        className="shrink-0 font-semibold text-accent hover:underline"
      >
        Upgrade to keep them →
      </Link>
    </div>
  );
}
