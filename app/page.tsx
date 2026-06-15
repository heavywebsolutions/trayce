import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

// Deviant Ink case-study numbers go here. Until then these are illustrative and
// labeled as such (see caption below). Swapping in real figures is a one-line edit.
const proof = [
  { v: "1,240", l: "scans", c: "" },
  { v: "1,080", l: "unique visitors", c: "" },
  { v: "96", l: "leads captured", c: "#10B98A" },
  { v: "7.7%", l: "scan → lead rate", c: "#FF6A45" },
];

const quotes = [
  "We updated the menu and the QR still goes to the old one.",
  "The promo ended but the flyers are already out there.",
  "We have no idea if anyone actually scans these.",
];

const toolkit: { key: string; title: string; body: string }[] = [
  { key: "codes", title: "Dynamic & static codes", body: "Editable codes for campaigns, free static codes for the basics." },
  { key: "designer", title: "QR designer", body: "Colors, dot and corner styles, your logo in the center, and frames." },
  { key: "types", title: "Every code type", body: "Links, vCards, WiFi, PDFs, menus, app stores, and more." },
  { key: "bio", title: "Link-in-bio pages", body: "Branded pages at your handle with links, video, and products." },
  { key: "domain", title: "Custom domains", body: "Put your bio page and links on your own domain." },
  { key: "analytics", title: "Scan & click analytics", body: "Locations, devices, trends, and your top performers." },
  { key: "leads", title: "Lead capture", body: "Forms on codes and pages. Export the contacts anytime." },
  { key: "email", title: "Email sync", body: "Send new contacts straight to your email tool." },
  { key: "shopify", title: "Shopify blocks", body: "Drop shoppable products right onto your bio page." },
  { key: "print", title: "Print & Ship", body: "Decals and signs, printed in house and shipped to you." },
  { key: "agency", title: "Built for agencies", body: "Multiple workspaces and bulk creation for many clients." },
  { key: "own", title: "You own your data", body: "Your codes, pages, scans, and leads belong to you." },
];

const faqs = [
  {
    q: "What is a dynamic QR code?",
    a: "A QR code whose destination you can change at any time without reprinting it. The printed code points to a redirect you control.",
  },
  {
    q: "Can I change a QR code after it's printed?",
    a: "Yes. Every TRAXXR code is editable for life. The printout never changes, the destination always can.",
  },
  {
    q: "Is this also a link-in-bio tool?",
    a: "Yes. TRAXXR includes branded link-in-bio pages at your own handle, with links, video, products, lead forms, click tracking, and a QR code for each page.",
  },
  {
    q: "Can I track scans and clicks?",
    a: "Yes. See total scans and clicks, locations, devices, trends, and your best-performing codes and links.",
  },
  {
    q: "Can TRAXXR print my codes?",
    a: "Yes. Order decals and countertop signs, printed in house and shipped to you.",
  },
  {
    q: "Is there a free plan, and do I need a card?",
    a: "Yes to the free plan, and no card is needed for the 14-day trial.",
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
    price: "$9.95",
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
    price: "$19.95",
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
    price: "$59.95",
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

// Clean monoline icons for the toolkit grid (no emoji).
function ToolIcon({ name }: { name: string }) {
  const p: Record<string, React.ReactNode> = {
    codes: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3" />
        <path d="M21 14v7h-7" />
      </>
    ),
    designer: (
      <>
        <path d="M15 4 20 9" />
        <path d="M14.5 5.5 5 15l-1.5 5.5L9 19l9.5-9.5z" />
      </>
    ),
    types: (
      <>
        <path d="M12 3 3 7.5l9 4.5 9-4.5z" />
        <path d="M3 12l9 4.5 9-4.5" />
        <path d="M3 16.5 12 21l9-4.5" />
      </>
    ),
    bio: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M10.5 18h3" />
      </>
    ),
    domain: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9z" />
      </>
    ),
    analytics: (
      <>
        <path d="M3 16l5-5 4 4 8-8" />
        <path d="M16 7h5v5" />
      </>
    ),
    leads: (
      <>
        <path d="M12 3v11" />
        <path d="M8 11l4 4 4-4" />
        <path d="M4 19h16" />
      </>
    ),
    email: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    shopify: (
      <>
        <path d="M6 2 3 6v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
    print: (
      <>
        <path d="M6 9V3h12v6" />
        <rect x="6" y="14" width="12" height="7" rx="1" />
        <path d="M6 17H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
      </>
    ),
    agency: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M2 21v-2a4 4 0 0 1 3-3.87" />
        <circle cx="9" cy="7" r="3.2" />
        <path d="M16 3.2a3.2 3.2 0 0 1 0 6.2" />
      </>
    ),
    own: (
      <>
        <path d="M12 2 4 5v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V5l-8-3z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {p[name]}
    </svg>
  );
}

// Small QR motif for the spotlight visuals.
function QrMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="#0A2540">
        <rect x="6" y="6" width="22" height="22" rx="1" fill="none" stroke="#0A2540" strokeWidth="5" />
        <rect x="14" y="14" width="6" height="6" />
        <rect x="72" y="6" width="22" height="22" rx="1" fill="none" stroke="#0A2540" strokeWidth="5" />
        <rect x="80" y="14" width="6" height="6" />
        <rect x="6" y="72" width="22" height="22" rx="1" fill="none" stroke="#0A2540" strokeWidth="5" />
        <rect x="14" y="80" width="6" height="6" />
        <rect x="40" y="8" width="6" height="6" /><rect x="52" y="8" width="6" height="6" />
        <rect x="40" y="20" width="6" height="6" /><rect x="60" y="20" width="6" height="6" />
        <rect x="38" y="38" width="6" height="6" /><rect x="50" y="38" width="6" height="6" /><rect x="62" y="38" width="6" height="6" />
        <rect x="74" y="40" width="6" height="6" /><rect x="86" y="40" width="6" height="6" />
        <rect x="40" y="50" width="6" height="6" /><rect x="74" y="52" width="6" height="6" />
        <rect x="50" y="62" width="6" height="6" /><rect x="62" y="62" width="6" height="6" /><rect x="86" y="62" width="6" height="6" />
        <rect x="40" y="74" width="6" height="6" /><rect x="52" y="86" width="6" height="6" />
        <rect x="64" y="74" width="6" height="6" /><rect x="76" y="74" width="6" height="6" /><rect x="88" y="74" width="6" height="6" />
      </g>
    </svg>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      {/* ===== Hero ===== */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_1.12fr] lg:pt-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
              The QR + link-in-bio platform
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-[3.3rem]">
              Printed the wrong link? Change it in seconds,{" "}
              <span className="text-[#1C6FBE]">not another print run.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
              TRAXXR makes QR codes you can edit after they are printed, plus
              branded link-in-bio pages, scan analytics, lead capture, and a
              built-in print shop. One platform for everything you put a code on.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="bg-[#2587DE] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#1C6FBE]"
              >
                Start free for 14 days →
              </Link>
              <Link
                href="#how"
                className="border border-ink-200 bg-white px-6 py-3 text-center text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-ink-400">
              No credit card · Free forever plan · Cancel in two clicks
            </p>
          </div>

          {/* hero visual: countertop sign + edit-after-print chips */}
          <div className="relative mx-auto w-full max-w-md py-4">
            <div
              className="absolute inset-x-6 top-2 bottom-2 -z-10"
              style={{
                background:
                  "radial-gradient(420px 300px at 70% 20%, #E9F2FC, transparent 70%)",
              }}
            />
            <div className="mx-auto w-[290px] border border-ink-200 bg-white p-7 text-center shadow-cardHover sm:w-[320px]">
              <p className="text-[12px] font-extrabold tracking-[0.12em] text-[#2587DE]">
                YOUR LOGO
              </p>
              <QrMotif className="mx-auto my-5 h-[170px] w-[170px]" />
              <p className="text-[28px] font-extrabold leading-[1.02] text-ink-900">
                LEAVE US
                <br />A REVIEW
              </p>
              <span className="mt-4 inline-block bg-[#1f7a3d] px-5 py-2 text-[12px] font-bold tracking-wide text-white">
                yourbrand.com
              </span>
            </div>

            <div className="absolute left-0 top-8 flex items-center gap-2 border border-ink-100 bg-white px-3 py-2 text-[12px] font-semibold text-ink-700 shadow-card">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1f7a3d] text-[9px] text-white">✓</span>
              Destination updated
            </div>
            <div className="absolute bottom-10 right-0 flex items-center gap-2 border border-ink-100 bg-white px-3 py-2 text-[12px] font-semibold text-ink-700 shadow-card">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1f7a3d] text-[9px] text-white">✓</span>
              1,248 scans this week
            </div>
          </div>
        </div>
      </section>

      {/* ===== Problem (gray) ===== */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-extrabold tracking-tight">
            A normal QR code is a one-way ticket.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-ink-500">
            Print it once, and every change after that means a reprint. Sound
            familiar?
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {quotes.map((q) => (
              <div key={q} className="border border-ink-200 bg-white p-5 text-[15px] font-medium text-ink-700">
                <span className="mb-2 block text-3xl leading-none text-ink-300">&ldquo;</span>
                {q}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-lg font-bold">TRAXXR codes are different.</p>
        </div>
      </section>

      {/* ===== Mechanism / dynamic codes (white) ===== */}
      <section id="how" className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.08fr]">
          {/* QR designer mockup */}
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
                <QrMotif className="h-[112px] w-[112px]" />
                <span className="bg-[#2587DE] px-3 py-1 text-[11px] font-bold tracking-wide text-white">
                  SCAN ME
                </span>
              </div>
              <div className="text-[13px]">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-400">
                  Destination
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border border-ink-200 bg-white px-3 py-2">
                    <span className="text-ink-500">Mon → Fall menu</span>
                    <span className="bg-[#2587DE] px-2 py-0.5 text-[10px] font-bold text-white">LIVE</span>
                  </div>
                  <div className="flex items-center justify-between border border-ink-200 bg-white px-3 py-2">
                    <span className="text-ink-500">Fri → Weekend promo</span>
                    <span className="bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-600">SET</span>
                  </div>
                  <div className="flex items-center justify-between border border-ink-200 bg-white px-3 py-2">
                    <span className="text-ink-500">Same printed code</span>
                    <span className="bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-white">LOCKED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1C6FBE]">
              Dynamic QR codes
            </p>
            <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              Your code is permanent. Where it points is not.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Print a TRAXXR code once, then change its destination as many times
              as you want, from your phone, in seconds. The square on the wall
              never changes. What it does is always up to you.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Center logo", "Editable after print", "PNG & SVG export"].map((c) => (
                <span key={c} className="border border-ink-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Analytics (gray) ===== */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.08fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1C6FBE]">
              Real analytics
            </p>
            <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              Stop guessing which marketing works.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Every scan and click in real time, when, where, on what device, and
              which exact code or link drove it. Finally know if the flyer beat the
              billboard, or the window decal beat the postcard.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Per-code & account-wide", "Location & device", "Unique vs. total"].map((c) => (
                <span key={c} className="border border-ink-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
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
                <p className="text-[13px] font-semibold text-ink-700">Scans by source</p>
                <p className="text-[11px] text-ink-400">last 30 days</p>
              </div>
              {[
                { n: "Window decal", w: "88%", v: "512" },
                { n: "Flyers", w: "64%", v: "372" },
                { n: "Business cards", w: "41%", v: "238" },
                { n: "Instagram bio", w: "21%", v: "118" },
              ].map((r) => (
                <div key={r.n} className="mb-3 flex items-center gap-3">
                  <span className="w-28 text-[13px] font-semibold text-ink-700">{r.n}</span>
                  <span className="h-2.5 flex-1 bg-ink-100">
                    <span className="block h-2.5 bg-[#2587DE]" style={{ width: r.w }} />
                  </span>
                  <span className="w-10 text-right text-[13px] font-bold tabular-nums">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Link-in-bio spotlight (white) ===== */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.08fr]">
          {/* bio mock */}
          <div className="mx-auto w-[300px] border border-ink-200 bg-ink-900 p-3 shadow-cardHover">
            <div className="bg-gradient-to-b from-[#1b3a5c] to-[#0A2540] p-5 text-center text-white">
              <div className="mx-auto h-16 w-16 border border-white/25 bg-gradient-to-br from-[#4aa3ef] to-[#2587DE]" />
              <p className="mt-3 font-extrabold">@yourbrand</p>
              <p className="mt-0.5 text-[11px] text-white/60">One link for everything we do</p>
              <div className="mt-3 flex justify-center gap-2 text-[10px] font-bold">
                {["IG", "TT", "YT", "X"].map((s) => (
                  <span key={s} className="grid h-7 w-7 place-items-center bg-white/15">{s}</span>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {["Shop the new drop", "Watch our story", "Leave a review", "Join the list"].map((b) => (
                  <div key={b} className="bg-white px-3 py-2.5 text-[12px] font-bold text-ink-900">{b}</div>
                ))}
              </div>
              <p className="mt-4 text-[9px] text-white/50">Powered by TRAXXR</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1C6FBE]">Link in bio</p>
            <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              More than a code. A home for every link you have.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Give your whole audience one branded page at your own handle. Drop in
              links, videos, products, and sign-up forms, and every page comes with
              its own QR code and click tracking built in.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Your own handle or custom domain",
                "Unlimited link, video, product, and form blocks",
                "Auto-pulled logos, themes, fonts, and colors",
                "A QR code and click tracking on every page",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2 text-[15px] text-ink-700">
                  <span className="font-bold text-[#2587DE]">✓</span> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== Print & Ship spotlight (gray) ===== */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.08fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1C6FBE]">Print &amp; Ship</p>
            <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              Design it, then we print and ship it.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Skip the print broker. Turn any code into a real, professional
              product, decals or countertop signs, printed in our own production
              house and shipped to your door. The same code stays editable forever.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Die-cut decals, window decals, and countertop signs",
                "Your designed code, logo, headline, and URL on every piece",
                "Ready-made templates, clean with zero design skill",
                "Approve a digital proof before anything prints",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2 text-[15px] text-ink-700">
                  <span className="font-bold text-[#2587DE]">✓</span> {c}
                </li>
              ))}
            </ul>
          </div>
          {/* sign mock */}
          <div className="mx-auto w-[260px] border border-ink-200 bg-white p-6 text-center shadow-cardHover">
            <p className="text-[11px] font-extrabold tracking-wide text-[#2587DE]">YOUR LOGO</p>
            <QrMotif className="mx-auto my-4 h-[130px] w-[130px]" />
            <p className="text-2xl font-extrabold leading-none text-ink-900">
              SCAN TO
              <br />
              ORDER
            </p>
            <span className="mt-3 inline-block bg-[#1f7a3d] px-4 py-1.5 text-[12px] font-bold text-white">
              order.yourbrand.com
            </span>
          </div>
        </div>
      </section>

      {/* ===== Full toolkit (white) ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              One subscription. The whole toolkit.
            </h2>
            <p className="mt-3 text-ink-500">
              TRAXXR is not just a QR generator. It is the full stack for codes,
              pages, and the data behind them.
            </p>
          </div>
          <div className="grid gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
            {toolkit.map((f) => (
              <div key={f.key} className="bg-white p-6">
                <span className="mb-3 grid h-10 w-10 place-items-center bg-[#E9F2FC] text-[#1C6FBE]">
                  <ToolIcon name={f.key} />
                </span>
                <h3 className="text-[15px] font-bold text-ink-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Proof (dark) ===== */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mb-7 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/40">
            What one campaign can do
          </p>
          <div className="grid grid-cols-2 border border-white/10 sm:grid-cols-4">
            {proof.map((s, i) => (
              <div
                key={s.l}
                className={`relative px-6 py-6 ${i < proof.length - 1 ? "sm:border-r" : ""} border-white/10 ${i < 2 ? "border-b sm:border-b-0" : ""}`}
              >
                <span className="absolute left-6 top-0 h-[3px] w-10" style={{ background: s.c || "#2587DE" }} />
                <p className="text-[2rem] font-extrabold leading-none tracking-tight" style={{ color: s.c || "#fff" }}>
                  {s.v}
                </p>
                <p className="mt-2 text-[12.5px] uppercase tracking-wide text-white/50">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-white/30">
            Illustrative figures. Real Deviant Ink case-study numbers drop in here
            before launch.
          </p>
        </div>
      </section>

      {/* ===== Pricing (gray) ===== */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              One tool instead of five.
            </h2>
            <p className="mt-3 text-ink-500">
              Replace your QR app, your link-in-bio tool, your analytics add-on,
              and your print broker. Pay less, own your leads, 0% sales fee, ever.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`bg-white p-6 ${t.highlight ? "border-2 border-ink-900" : "border border-ink-200"}`}
              >
                <p className="text-[13px] font-bold uppercase tracking-wide text-ink-500">{t.name}</p>
                <p className="mt-2">
                  <span className="text-3xl font-extrabold">{t.price}</span>
                  <span className="text-sm text-ink-400">/mo</span>
                </p>
                <p className="mt-1 text-xs text-ink-400">{t.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm text-ink-600">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[#2587DE]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 block px-4 py-2.5 text-center text-sm font-bold ${
                    t.highlight
                      ? "bg-[#2587DE] text-white hover:bg-[#1C6FBE]"
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

      {/* ===== Testimonial (dark) ===== */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xl font-medium leading-relaxed sm:text-2xl">
            &ldquo;We put a TRAXXR code on every wrap we print. For the first time
            we can see which designs actually drive people back to the site, and
            the leads land in our email tool automatically.&rdquo;
          </p>
          <p className="mt-5 text-sm text-white/60">Customer · Deviant Ink</p>
        </div>
      </section>

      {/* ===== FAQ (white) ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight">
            Questions, answered
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group border border-ink-200 bg-white p-5">
                <summary className="flex cursor-pointer items-center justify-between text-[15px] font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-2xl leading-none text-[#2587DE] group-open:hidden">+</span>
                  <span className="hidden text-2xl leading-none text-[#2587DE] group-open:inline">–</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA (gray) ===== */}
      <section className="border-t border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            The next batch you print should outlive a dozen promotions.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink-500">
            Codes, pages, analytics, and printing. Make them all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="bg-[#2587DE] px-7 py-3 text-sm font-semibold text-white hover:bg-[#1C6FBE]"
            >
              Start free for 14 days →
            </Link>
            <Link
              href="#how"
              className="border border-ink-200 bg-white px-7 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-ink-400">
            No credit card required · Free forever plan
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
