import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-sm font-bold text-white">
        T
      </span>
      <span className="text-lg font-semibold tracking-tight text-ink-900">
        Trayce
      </span>
    </span>
  );
}

const features = [
  {
    title: "Dynamic QR codes",
    body: "Edit where a printed code points anytime — no reprinting. Custom colors, logos, frames, and a Scan-Me call-to-action.",
  },
  {
    title: "Link-in-bio pages",
    body: "A branded page at trayce.app/@you with links, video, products, and email capture. Replace Linktree, keep the data.",
  },
  {
    title: "Lead capture",
    body: "Turn any code or bio link into an on-page form. Every submission is an owned contact — never rented.",
  },
  {
    title: "Real analytics",
    body: "Scans and clicks over time, unique visitors, device, and location. Per-code and across your whole account.",
  },
  {
    title: "Email sync",
    body: "Pipe every lead straight into Klaviyo, Mailchimp, ConvertKit, Brevo, or any tool via webhook — in real time.",
  },
  {
    title: "Shoppable blocks",
    body: "Drop live Shopify products onto your pages with image, price, and a buy button pulled straight from your store.",
  },
];

const steps = [
  {
    n: "1",
    title: "Create",
    body: "Generate a code or a bio page in seconds, styled to your brand.",
  },
  {
    n: "2",
    title: "Print & share",
    body: "Put it on a wrap, a banner, a sticker, or your social bio.",
  },
  {
    n: "3",
    title: "Measure",
    body: "Watch scans, clicks, and leads roll in — and edit anytime.",
  },
];

const tiers = [
  {
    name: "Free",
    price: "$0",
    tagline: "Get started",
    features: ["Unlimited static codes", "1 bio page", "Basic scan counts"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$12",
    tagline: "For one brand",
    features: [
      "Dynamic, editable codes",
      "Full customization + logos",
      "Analytics with history",
      "Unlimited bio pages",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$29",
    tagline: "Most popular",
    features: [
      "Everything in Starter",
      "Lead capture forms",
      "Email sync (Klaviyo, etc.)",
      "Shopify product blocks",
    ],
    cta: "Start free",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$99",
    tagline: "For teams & resellers",
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

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-white text-ink-900">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:text-ink-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Start free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(79,70,229,0.10), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> QR codes
            · link-in-bio · lead capture
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
            Your offline marketing should earn its keep.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500">
            Trayce turns every wrap, sticker, banner, and bio link into a
            trackable, editable, lead-generating asset — with the data flowing
            straight to your tools.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Start free — no card
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-ink-200 px-6 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Product mock */}
        <div className="mx-auto max-w-4xl px-6 pb-16">
          <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3 shadow-cardHover">
            <div className="rounded-xl border border-ink-200 bg-white p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-ink-100 bg-white p-4">
                  <p className="text-xs font-medium text-ink-500">
                    Attributed revenue
                  </p>
                  <p className="tabular mt-1 text-2xl font-semibold">$4,280</p>
                  <p className="mt-1 text-xs text-emerald-600">
                    ↑ from 612 scans
                  </p>
                </div>
                <div className="rounded-xl border border-ink-100 bg-white p-4">
                  <p className="text-xs font-medium text-ink-500">Total scans</p>
                  <p className="tabular mt-1 text-2xl font-semibold">7,941</p>
                  <p className="mt-1 text-xs text-ink-400">last 30 days</p>
                </div>
                <div className="rounded-xl border border-ink-100 bg-white p-4">
                  <p className="text-xs font-medium text-ink-500">New leads</p>
                  <p className="tabular mt-1 text-2xl font-semibold">318</p>
                  <p className="mt-1 text-xs text-ink-400">synced to Klaviyo</p>
                </div>
              </div>
              <div className="mt-4 flex h-24 items-end gap-1.5">
                {[30, 45, 38, 60, 52, 70, 64, 82, 76, 90, 72, 96].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-accent/70"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → solution */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Online marketing tracks every click. Offline has been a guess.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-500">
            You spend real money on physical marketing — wraps, prints, packaging,
            events — and then have no idea what it did. Trayce closes that loop:
            every physical touchpoint becomes measurable, editable, and connected
            to the rest of your stack.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything your physical marketing was missing
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card transition hover:shadow-cardHover"
            >
              <h3 className="text-base font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Simple pricing. Free to start.
          </h2>
          <p className="mt-3 text-ink-500">
            Static codes are free forever. Upgrade when you want to edit, track,
            and capture.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border p-6 ${
                t.highlight
                  ? "border-accent-ring bg-white shadow-cardHover ring-1 ring-accent-ring"
                  : "border-ink-200 bg-white shadow-card"
              }`}
            >
              {t.highlight && (
                <span className="mb-2 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                  {t.tagline}
                </span>
              )}
              <h3 className="text-base font-semibold text-ink-900">{t.name}</h3>
              {!t.highlight && (
                <p className="text-xs text-ink-400">{t.tagline}</p>
              )}
              <p className="mt-3">
                <span className="text-3xl font-semibold">{t.price}</span>
                <span className="text-sm text-ink-400">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-600">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-accent">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
                  t.highlight
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "border border-ink-200 text-ink-700 hover:bg-ink-50"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-ink-400">
          Prices in USD. Annual billing saves two months.
        </p>
      </section>

      {/* Social proof */}
      <section className="border-t border-ink-100 bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xl font-medium leading-relaxed sm:text-2xl">
            “We put a Trayce code on every sled wrap. For the first time we can
            see which designs actually drive people back to the site — and the
            leads land in our email tool automatically.”
          </p>
          <p className="mt-5 text-sm text-white/70">
            Launch partner · Deviant Ink Sledwraps
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Make your offline marketing measurable.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-ink-500">
          Create your first code in under a minute. Free, no card required.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-xl bg-accent px-7 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Start free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} Trayce. Turn scans into revenue.
          </p>
        </div>
      </footer>
    </main>
  );
}
