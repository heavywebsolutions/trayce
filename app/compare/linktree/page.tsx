import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Traxxr vs Linktree",
  description:
    "Linktree is a great bio link. Traxxr is a bio link plus trackable QR codes for your printed marketing, and it leaves every sale and every lead with you.",
};

const rows = [
  {
    f: "Link-in-bio page",
    t: "Yes, at your own handle",
    o: "Yes, its core product",
  },
  {
    f: "Dynamic QR codes for print",
    t: "Yes, editable and trackable",
    o: "A QR to your bio page only",
  },
  {
    f: "Scan and click analytics",
    t: "Per code and per link, with location and device",
    o: "Click analytics on your links",
  },
  {
    f: "Lead capture you own",
    t: "Forms on any code or page, the contacts are yours",
    o: "Email collection on paid tiers",
  },
  {
    f: "Email tool sync",
    t: "Klaviyo, Mailchimp, and more, plus webhook",
    o: "A set of integrations",
  },
  {
    f: "Fee on your sales",
    t: "0%",
    o: "Takes a cut of some commerce sales",
  },
  {
    f: "Editable after print",
    t: "Yes",
    o: "Not for printed codes",
  },
];

export default function CompareLinktreePage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            Comparison
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Traxxr vs Linktree
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Linktree is a great bio link. Traxxr is a bio link plus the trackable
            QR codes that connect your printed marketing, and it leaves every sale
            and every lead with you.
          </p>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 pb-6">
          <div className="border border-ink-200">
            <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-ink-900 text-xs font-bold uppercase tracking-wide text-white">
              <div className="px-4 py-3">Feature</div>
              <div className="border-l border-white/15 px-4 py-3">Traxxr</div>
              <div className="border-l border-white/15 px-4 py-3">Linktree</div>
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
            This comparison reflects public information at the time of writing.
            Linktree changes its plans and features, so check their site for the
            latest.
          </p>
        </div>
      </section>

      {/* Fair take */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              When Linktree is plenty
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-500">
              If all you need is a simple page of links in your social bio, and
              nothing you do is physical, Linktree handles that well and you may
              not need more.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              When Traxxr fits better
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-500">
              If you also print things, want to track scans, want to keep your
              leads, or would rather not pay a fee on your sales, Traxxr covers
              more ground for less.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Keep the bio page. Add the rest.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Move your links over, add trackable codes, and stop paying a cut of
            your sales. Free to start.
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
