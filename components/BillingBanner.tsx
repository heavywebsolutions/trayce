import { createClient } from "@/lib/supabase/server";
import { openBillingPortal } from "@/app/dashboard/billing/actions";

// Surfaces two billing-health states inline at the top of the dashboard:
//  - past_due / payment failed: we kept access during the retry window, but the
//    customer needs to fix their card before it runs out.
//  - card expiring soon: a heads-up before the renewal that would fail.
// Renders nothing when billing is healthy.
export async function BillingBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ws } = await supabase
    .from("workspaces")
    .select(
      "subscription_status, payment_failed_at, card_brand, card_last4, card_exp_month, card_exp_year, stripe_subscription_id"
    )
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!ws || !ws.stripe_subscription_id) return null;

  const cardName =
    (ws.card_brand
      ? String(ws.card_brand)[0].toUpperCase() + String(ws.card_brand).slice(1)
      : "your card") + (ws.card_last4 ? ` ending ${ws.card_last4}` : "");

  const pastDue =
    ws.subscription_status === "past_due" || Boolean(ws.payment_failed_at);

  // Card expiring within ~6 weeks (and not already a hard failure).
  let expiringSoon = false;
  let expLabel = "";
  if (!pastDue && ws.card_exp_month && ws.card_exp_year) {
    const expEnd = new Date(
      ws.card_exp_year as number,
      ws.card_exp_month as number,
      0,
      23,
      59,
      59
    ).getTime();
    const days = Math.ceil((expEnd - Date.now()) / 86_400_000);
    if (days <= 45 && days >= -3) {
      expiringSoon = true;
      expLabel = `${String(ws.card_exp_month).padStart(2, "0")}/${
        ws.card_exp_year
      }`;
    }
  }

  if (!pastDue && !expiringSoon) return null;

  const message = pastDue
    ? `We could not process your last payment with ${cardName}. Your plan is still active for now. Update your card to avoid losing access.`
    : `${cardName} expires ${expLabel}. Update it now so your next renewal goes through without a hitch.`;

  // Past-due is urgent (warm red); expiring-soon is a calm heads-up (brand blue).
  const tone = pastDue
    ? "border-red-200 bg-red-50 text-red-900"
    : "border-accent/30 bg-accent-soft text-ink-800";
  const btn = pastDue
    ? "bg-red-600 text-white hover:bg-red-700"
    : "bg-accent text-white hover:bg-accent-hover";

  return (
    <div
      className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${tone}`}
    >
      <span className="min-w-0">{message}</span>
      <form action={openBillingPortal} className="shrink-0">
        <button
          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold ${btn}`}
        >
          Update card
        </button>
      </form>
    </div>
  );
}
