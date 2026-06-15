import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "TRAXXR vs standalone QR code tools",
  description:
    "Free QR generators give you a static image and nothing else. Pricey QR platforms add tracking but stop at the code. TRAXXR gives you editable codes, real analytics, a bio page, and lead capture in one account.",
};

const rows = [
  {
    f: "Make a static code",
    t: "Yes, free for good",
    o: "Yes, usually free",
  },
  {
    f: "Edit the destination after printing",
    t: "Yes",
    o: "Only on paid dynamic plans, if at all",
  },
  {
    f: "Scan analytics",
    t: "Yes, with location and device",
    o: "Free tools, none. Paid tools, yes",
  },
  {
    f: "Link-in-bio page included",
    t: "Yes",
    o: "No, codes only",
  },
  {
    f: "Lead capture and email sync",
    t: "Yes, contacts you own",
    o: "Rarely",
  },
  {
    f: "Starting price for dynamic codes",
    t: "$9.95 a month",
    o: "Often $9 to $49 a month",
  },
  {
    f: "Your leads",
    t: "Yours to keep and export",
    o: "Usually not part of the tool",
  },
];

export default function CompareQrPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            Comparison
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            TRAXXR vs standalone QR tools
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Free QR generators give you a static image and nothing else. The
            pricey platforms add tracking but stop at the code. TRAXXR gives you
            editable codes, real analytics, a bio page, and lead capture in one
            account.
          </p>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 pb-6">
          <div className="border border-ink-200">
            <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-ink-900 text-xs font-bold uppercase tracking-wide text-white">
              <div className="px-4 py-3">Feature</div>
              <div className="border-l border-white/15 px-4 py-3">TRAXXR</div>
              <div className="border-l border-white/15 px-4 py-3">QR tools</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.f}
                className={`grid grid-cols-[1.2fr_1fr_1fr] text-sm ${
                  i % 2 ? "bg-ink-50" : "bg-white"
                }`}
              >
                <div className="px-4 py-3 font-semibold text-ink-800">{r.f}</div>
                <div className="border-l border-ink-200 px-4 py-3 text-ink-700">
                  {r.t}
                </div>
                <div className="border-l border-ink-200 px-4 py-3 text-ink-500">
                  {r.o}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-400">
            This comparison reflects common features and pricing of QR tools at
            the time of writing. Specific products differ, so check the tool you
            are looking at for the latest.
          </p>
        </div>
      </section>

      {/* Fair take */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              When a basic generator is fine
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-500">
              If you need a single code that points at one link forever, and you
              do not care who scanned it, a free generator does the trick.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              When TRAXXR fits better
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-500">
              The moment you want to change a code after printing, see your scans,
              capture leads, or run a bio page next to your codes, one TRAXXR
              account replaces the pile of separate tools.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            One account for codes, links, and leads.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Start with a free static code today. Upgrade the day you want to edit
            it or track it.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block bg-[#2587DE] px-7 py-3 text-sm font-semibold text-white hover:bg-[#1C6FBE]"
          >
            Start free →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
