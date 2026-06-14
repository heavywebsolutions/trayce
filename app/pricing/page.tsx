import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing | Traxxr",
  description:
    "Start free and stay free for as long as you like. Upgrade when you want editable codes, scan history, and lead capture. No contracts, and we never take a cut of your sales.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    tagline: "Get started",
    features: [
      "Unlimited static QR codes",
      "1 link-in-bio page",
      "Basic scan counts",
      "All 8 code types",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$9.95",
    tagline: "For one brand",
    features: [
      "Everything in Free",
      "Dynamic, editable codes",
      "Full design with logos and frames",
      "Scan history and analytics",
      "Unlimited bio pages",
    ],
    cta: "Start free",
    highlight: true,
  },
  {
    name: "Growth",
    price: "$19.95",
    tagline: "The money tier",
    features: [
      "Everything in Starter",
      "Lead capture forms",
      "Email sync to Klaviyo and more",
      "Shopify product blocks",
      "Location and device data",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Agency",
    price: "$59.95",
    tagline: "Teams and resellers",
    features: [
      "Everything in Growth",
      "Bulk code generation",
      "Multiple workspaces",
      "Priority support",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

const faqs = [
  {
    q: "Is the free plan really free?",
    a: "Yes. Static codes, one bio page, and basic scan counts cost nothing, with no time limit and no card required. You only pay when you want to edit a printed code, keep scan history, or capture leads.",
  },
  {
    q: "What is a dynamic code?",
    a: "A code whose destination you can change after it is printed. Run a sale today, point the same sticker at a new page tomorrow. The printed code never changes, but where it sends people always can.",
  },
  {
    q: "Do you take a percentage of my sales?",
    a: "No. Zero. Linktree charges a fee on sales made through its links. Traxxr does not take a cent of what you sell.",
  },
  {
    q: "Who owns the leads I collect?",
    a: "You do. Every contact someone gives you is yours to export or sync to your email tool whenever you want. We never rent your list back to you.",
  },
  {
    q: "Can I change or cancel my plan anytime?",
    a: "Yes. Move up or down whenever it suits you. Nothing locks you in, and there are no contracts.",
  },
  {
    q: "What happens to my printed codes if I downgrade?",
    a: "They keep working. The dynamic features pause, but the codes still resolve, so nothing you already printed goes dead.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C63C2]">
            Pricing
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Pricing that pays for itself the first time someone scans.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Start on the free plan and stay there as long as you like. Upgrade the
            day you want to edit a printed code, see where your scans come from, or
            capture leads you keep. No contracts, and we never take a cut of your
            sales.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 pb-8">
          <div className="grid gap-4 lg:grid-cols-4">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`bg-white p-6 ${
                  t.highlight
                    ? "border-2 border-ink-900"
                    : "border border-ink-200"
                }`}
              >
                <p className="text-[13px] font-bold uppercase tracking-wide text-ink-500">
                  {t.name}
                </p>
                <p className="mt-2">
                  <span className="text-3xl font-extrabold">{t.price}</span>
                  <span className="text-sm text-ink-400">/mo</span>
                </p>
                <p className="mt-1 text-xs text-ink-400">{t.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm text-ink-600">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[#2E80E6]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 block px-4 py-2.5 text-center text-sm font-bold ${
                    t.highlight
                      ? "bg-[#2E80E6] text-white hover:bg-[#1C63C2]"
                      : "border border-ink-200 text-ink-700 hover:bg-ink-50"
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-ink-500">
            <span>No card to start</span>
            <span>Cancel anytime</span>
            <span>0% sales fee</span>
            <span>Your leads stay yours</span>
            <span>Annual billing saves two months</span>
          </div>
        </div>
      </section>

      {/* Free forever clarity */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            What &ldquo;free forever&rdquo; actually means
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            Your static QR codes never expire and never cost a thing. Print them,
            stick them anywhere, and watch the scan counts add up. You only reach
            for a paid plan when you want to change where a code points after it is
            printed, keep your full scan history, or collect contact details from
            the people who scan. No surprise limits, no pressure.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight">
            Questions people ask before they start
          </h2>
          <div className="divide-y divide-ink-100 border-y border-ink-100">
            {faqs.map((f) => (
              <div key={f.q} className="py-6">
                <h3 className="text-base font-bold text-ink-900">{f.q}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Start on the free plan today.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Make your first code, print it, and see the scans roll in. Upgrade
            only if and when you need to.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block bg-[#2E80E6] px-7 py-3 text-sm font-semibold text-white hover:bg-[#1C63C2]"
          >
            Start free →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
