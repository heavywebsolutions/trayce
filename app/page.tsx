import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Logo() {
  return <img src="/traxxr-logo.png" alt="Traxxr" className="h-7 w-auto" />;
}

function LogoLight() {
  return (
    <img
      src="/traxxr-logo.png"
      alt="Traxxr"
      className="h-7 w-auto brightness-0 invert"
    />
  );
}

const proof = [
  { v: "1,240", l: "scans", c: "" },
  { v: "1,080", l: "unique visitors", c: "" },
  { v: "96", l: "leads captured", c: "#10B98A" },
  { v: "7.7%", l: "scan → lead rate", c: "#FF6A45" },
];

const moreFeatures = [
  {
    title: "Link-in-bio that pays you back",
    body: "A branded page for every social bio — links, video, products, and email signup. Replace Linktree, keep 100% of your sales, own the audience.",
  },
  {
    title: "Lead capture you own",
    body: "Turn any code or bio link into an on-page form. Every submission is a contact that's yours to keep — never rented.",
  },
  {
    title: "Real-time email sync",
    body: "Pipe every lead straight into Klaviyo, Mailchimp, ConvertKit, Brevo, or any tool via webhook — the moment they sign up.",
  },
  {
    title: "Shoppable blocks",
    body: "Drop live Shopify products onto your pages — image, price, and a buy button pulled straight from your store.",
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
    highlight: true,
  },
  {
    name: "Growth",
    price: "$29",
    tagline: "The money tier",
    features: [
      "Everything in Starter",
      "Lead capture forms",
      "Email sync (Klaviyo, etc.)",
      "Shopify product blocks",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Agency",
    price: "$99",
    tagline: "Teams & resellers",
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

const chartPath =
  "M0,95 L40,86 L80,90 L120,70 L160,74 L200,52 L240,58 L280,38 L320,44 L360,26 L400,30 L460,14";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-white text-ink-900">
      {/* ===== Nav ===== */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Start free
          </Link>
        </nav>
      </header>

      {/* ===== BAND 1 · Hero (white) ===== */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_1.12fr] lg:pt-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C63C2]">
              For any brand that prints, posts &amp; sells
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-[3.3rem]">
              Every scan and click, tracked. Every lead{" "}
              <span className="text-[#1C63C2]">yours to keep.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
              Put a Traxxr code on anything you print — packaging, flyers,
              signage, business cards — and a smart link in every bio. Track
              every scan and click, capture leads you own, and sync them straight
              to your email list. Editable anytime. No reprints.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="bg-[#2E80E6] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#1C63C2]"
              >
                Start free →
              </Link>
              <Link
                href="/login"
                className="border border-ink-200 bg-white px-6 py-3 text-center text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-ink-400">
              No credit card · Free forever plan · Replaces Linktree + your QR
              tool · 0% sales fee
            </p>
          </div>

          {/* dashboard mockup */}
          <div className="border border-ink-200 bg-white shadow-cardHover">
            <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-3 py-2.5">
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="ml-2 flex-1 border border-ink-200 bg-white px-3 py-1 font-mono text-[11px] text-ink-400">
                traxxr.com/dashboard
              </span>
            </div>
            <div className="bg-ink-50/50 p-4">
              <div className="mb-3 grid grid-cols-3 gap-2.5">
                <div className="border border-ink-200 bg-white px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">
                    Scans
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums">
                    1,240
                  </p>
                </div>
                <div className="border border-ink-200 bg-white px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">
                    Unique
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums">
                    1,080
                  </p>
                </div>
                <div className="border border-ink-200 bg-white px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">
                    Leads
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#10B98A]">
                    96
                  </p>
                </div>
              </div>
              <div className="border border-ink-200 bg-white p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-ink-700">
                    Scans over time
                  </p>
                  <p className="text-[11px] text-ink-400">last 30 days</p>
                </div>
                <svg
                  viewBox="0 0 460 120"
                  className="h-[110px] w-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="heroG" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#2E80E6" stopOpacity="0.38" />
                      <stop offset="1" stopColor="#2E80E6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${chartPath} L460,120 L0,120 Z`} fill="url(#heroG)" />
                  <path
                    d={chartPath}
                    fill="none"
                    stroke="#2E80E6"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="360"
                    cy="26"
                    r="4"
                    fill="#fff"
                    stroke="#2E80E6"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BAND 2 · Proof (dark) ===== */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mb-7 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/40">
            What one campaign can do
          </p>
          <div className="grid grid-cols-2 border border-white/10 sm:grid-cols-4">
            {proof.map((s, i) => (
              <div
                key={s.l}
                className={`relative px-6 py-6 ${
                  i < proof.length - 1 ? "sm:border-r" : ""
                } border-white/10 ${i < 2 ? "border-b sm:border-b-0" : ""}`}
              >
                <span
                  className="absolute left-6 top-0 h-[3px] w-10"
                  style={{ background: s.c || "#2E80E6" }}
                />
                <p
                  className="text-[2rem] font-extrabold leading-none tracking-tight"
                  style={{ color: s.c || "#fff" }}
                >
                  {s.v}
                </p>
                <p className="mt-2 text-[12.5px] uppercase tracking-wide text-white/50">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-white/30">
            Illustrative figures — your real numbers appear here as your codes
            get scanned.
          </p>
        </div>
      </section>

      {/* ===== BAND 3 · Feature: Dynamic codes (white) ===== */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.08fr]">
          {/* qr designer mockup */}
          <div className="border border-ink-200 bg-white shadow-cardHover">
            <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-3 py-2.5">
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="ml-2 flex-1 border border-ink-200 bg-white px-3 py-1 font-mono text-[11px] text-ink-400">
                traxxr.com/dashboard/codes
              </span>
            </div>
            <div className="grid grid-cols-[148px_1fr] items-start gap-5 bg-ink-50/50 p-5">
              <div className="flex flex-col items-center gap-2.5 border border-ink-200 bg-white p-4 shadow-card">
                <svg width="112" height="112" viewBox="0 0 29 29" className="text-ink-900">
                  <rect fill="currentColor" x="0" y="0" width="7" height="7" />
                  <rect x="2" y="2" width="3" height="3" fill="#fff" />
                  <rect fill="currentColor" x="22" y="0" width="7" height="7" />
                  <rect x="24" y="2" width="3" height="3" fill="#fff" />
                  <rect fill="currentColor" x="0" y="22" width="7" height="7" />
                  <rect x="2" y="24" width="3" height="3" fill="#fff" />
                  <g fill="currentColor">
                    <rect x="9" y="1" width="2" height="2" />
                    <rect x="13" y="1" width="2" height="2" />
                    <rect x="17" y="3" width="2" height="2" />
                    <rect x="10" y="5" width="2" height="2" />
                    <rect x="14" y="6" width="2" height="2" />
                    <rect x="18" y="8" width="2" height="2" />
                    <rect x="1" y="9" width="2" height="2" />
                    <rect x="5" y="11" width="2" height="2" />
                    <rect x="9" y="9" width="2" height="2" />
                    <rect x="12" y="10" width="2" height="2" />
                    <rect x="16" y="12" width="2" height="2" />
                    <rect x="20" y="10" width="2" height="2" />
                    <rect x="24" y="9" width="2" height="2" />
                    <rect x="27" y="12" width="2" height="2" />
                    <rect x="11" y="14" width="2" height="2" />
                    <rect x="15" y="16" width="2" height="2" />
                    <rect x="19" y="15" width="2" height="2" />
                    <rect x="23" y="17" width="2" height="2" />
                    <rect x="9" y="18" width="2" height="2" />
                    <rect x="13" y="20" width="2" height="2" />
                    <rect x="17" y="22" width="2" height="2" />
                    <rect x="21" y="24" width="2" height="2" />
                    <rect x="25" y="22" width="2" height="2" />
                    <rect x="11" y="25" width="2" height="2" />
                    <rect x="15" y="27" width="2" height="2" />
                    <rect x="19" y="26" width="2" height="2" />
                  </g>
                  <rect x="12" y="12" width="5" height="5" fill="#2E80E6" />
                </svg>
                <span className="bg-[#2E80E6] px-3 py-1 text-[11px] font-bold tracking-wide text-white">
                  SCAN ME
                </span>
              </div>
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-400">
                  Code color
                </p>
                <div className="mb-3.5 flex gap-2">
                  {["#0b1220", "#2E80E6", "#10B98A", "#FF6A45", "#7c3aed"].map(
                    (c, i) => (
                      <span
                        key={c}
                        className="h-6 w-6 border-2"
                        style={{
                          background: c,
                          borderColor: i === 0 ? "#0a1424" : "transparent",
                        }}
                      />
                    )
                  )}
                </div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-400">
                  Dot style
                </p>
                <div className="mb-4 flex gap-2">
                  <span className="grid h-8 w-8 place-items-center border-2 border-[#2E80E6] bg-white">
                    <span className="h-3.5 w-3.5 bg-ink-700" />
                  </span>
                  <span className="grid h-8 w-8 place-items-center border border-ink-200 bg-white">
                    <span className="h-3.5 w-3.5 rounded-full bg-ink-700" />
                  </span>
                  <span className="grid h-8 w-8 place-items-center border border-ink-200 bg-white">
                    <span className="h-3.5 w-3.5 bg-ink-700" />
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-ink-900 px-3.5 py-2 text-xs font-bold text-white">
                    Save design
                  </span>
                  <span className="border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-600">
                    PNG
                  </span>
                  <span className="border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-600">
                    SVG
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1C63C2]">
              Dynamic QR codes
            </p>
            <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              Codes you can change after they&apos;re printed.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Design a branded code — your colors, your logo dead-center, a “Scan
              Me” frame. Then re-point it anywhere, anytime: a new offer, an
              updated menu, a different page. The printed code never changes. What
              it does always can.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Center logo", "Editable after print", "PNG & SVG export"].map(
                (c) => (
                  <span
                    key={c}
                    className="border border-ink-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-700"
                  >
                    {c}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BAND 4 · Feature: Analytics (gray) ===== */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.08fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1C63C2]">
              Real analytics
            </p>
            <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              Stop guessing which marketing works.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Every scan and click in real time — when, where, on what device, and
              which exact code or link drove it. Finally know if the flyer beat
              the billboard, or the window decal beat the postcard.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Per-code & account-wide", "Location & device", "Unique vs. total"].map(
                (c) => (
                  <span
                    key={c}
                    className="border border-ink-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-700"
                  >
                    {c}
                  </span>
                )
              )}
            </div>
          </div>
          {/* scans-by-source mockup */}
          <div className="border border-ink-200 bg-white shadow-cardHover">
            <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-3 py-2.5">
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="h-2.5 w-2.5 bg-ink-300" />
              <span className="ml-2 flex-1 border border-ink-200 bg-white px-3 py-1 font-mono text-[11px] text-ink-400">
                traxxr.com/dashboard/analytics
              </span>
            </div>
            <div className="bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink-700">
                  Scans by source
                </p>
                <p className="text-[11px] text-ink-400">last 30 days</p>
              </div>
              {[
                { n: "Window decal", w: "88%", v: "512" },
                { n: "Flyers", w: "64%", v: "372" },
                { n: "Business cards", w: "41%", v: "238" },
                { n: "Instagram bio", w: "21%", v: "118" },
              ].map((r) => (
                <div key={r.n} className="mb-3 flex items-center gap-3">
                  <span className="w-28 text-[13px] font-semibold text-ink-700">
                    {r.n}
                  </span>
                  <span className="h-2.5 flex-1 bg-ink-100">
                    <span
                      className="block h-2.5 bg-[#2E80E6]"
                      style={{ width: r.w }}
                    />
                  </span>
                  <span className="w-10 text-right text-[13px] font-bold tabular-nums">
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BAND 5 · More features (white) ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              One tool where your codes, links, and leads all live.
            </h2>
          </div>
          <div className="grid gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
            {moreFeatures.map((f) => (
              <div key={f.title} className="bg-white p-6">
                <h3 className="text-[15px] font-bold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BAND 6 · Pricing (gray) ===== */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Everything Linktree and a QR tool do — in one place, for less.
            </h2>
            <p className="mt-3 text-ink-500">
              Cancel both. Pay less. Own your leads. 0% sales fee, ever.
            </p>
          </div>
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
          <p className="mt-6 text-center text-xs text-ink-400">
            Prices in USD. Annual billing saves two months.
          </p>
        </div>
      </section>

      {/* ===== BAND 7 · Testimonial (dark) ===== */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xl font-medium leading-relaxed sm:text-2xl">
            “We put a Traxxr code on every wrap we print. For the first time we
            can see which designs actually drive people back to the site — and the
            leads land in our email tool automatically.”
          </p>
          <p className="mt-5 text-sm text-white/60">
            Customer · Deviant Ink
          </p>
        </div>
      </section>

      {/* ===== BAND 8 · Final CTA (white) ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Stop running marketing you can&apos;t measure.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink-500">
            Create your first code, print it, and watch the scans roll in — free.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="bg-[#2E80E6] px-7 py-3 text-sm font-semibold text-white hover:bg-[#1C63C2]"
            >
              Start free →
            </Link>
            <Link
              href="/login"
              className="border border-ink-200 px-7 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-ink-400">
            No credit card required · Free forever plan
          </p>
        </div>
      </section>

      {/* ===== Footer (dark) ===== */}
      <footer className="bg-ink-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <LogoLight />
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Traxxr. Know what your marketing does.
          </p>
        </div>
      </footer>
    </main>
  );
}
