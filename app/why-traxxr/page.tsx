import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Why TRAXXR",
  description:
    "Most businesses run a link-in-bio tool and a QR generator that never talk to each other, and one takes a cut of sales. TRAXXR puts both in one place and leaves the leads and the revenue with you.",
};

const reasons = [
  {
    n: "01",
    h: "One account instead of two logins.",
    p: "A bio-page tool and a QR tool usually live in separate apps, with separate bills and no shared data. TRAXXR runs both from one account, so a scan on a flyer and a click in your bio show up on the same dashboard.",
  },
  {
    n: "02",
    h: "You keep your leads, and all of your sales.",
    p: "When someone buys through a Linktree link, Linktree takes a percentage. When someone joins your list through TRAXXR, the contact is yours and the sale is yours. We charge for the software, never for what you make.",
  },
  {
    n: "03",
    h: "Change a printed code without reprinting.",
    p: "Cheap QR generators hand you a static image and walk away. If the link breaks or the offer ends, the sticker is dead. TRAXXR codes are editable, so the code you printed last year can point at this week's page.",
  },
  {
    n: "04",
    h: "Made for businesses that print and post.",
    p: "TRAXXR is not built for a marketing team of forty. It is built for the shop, the studio, the restaurant, and the brand that prints things, lives on social, and wants to know what all of it actually does.",
  },
];

export default function WhyTRAXXRPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            Why TRAXXR
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Why people switch to TRAXXR.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Most businesses run two tools that never talk to each other: a
            link-in-bio page and a QR generator. Neither one shows you what your
            printed marketing did, and one of them takes a cut of your sales.
            TRAXXR puts both in one place and leaves the leads and the revenue with
            you.
          </p>
        </div>
      </section>

      {/* Reasons */}
      <section className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="divide-y divide-ink-100 border-y border-ink-100">
            {reasons.map((r) => (
              <div key={r.n} className="grid gap-4 py-8 sm:grid-cols-[64px_1fr]">
                <p className="text-2xl font-extrabold tabular-nums text-[#2587DE]">
                  {r.n}
                </p>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">{r.h}</h2>
                  <p className="mt-2 text-base leading-relaxed text-ink-500">
                    {r.p}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison teaser */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            See how TRAXXR stacks up
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/compare/linktree"
              className="group border border-ink-200 bg-white p-6 hover:border-ink-900"
            >
              <p className="text-lg font-bold">TRAXXR vs Linktree</p>
              <p className="mt-2 text-sm text-ink-500">
                The same bio page, plus trackable QR codes and zero fees on your
                sales.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#1C6FBE]">
                Compare →
              </span>
            </Link>
            <Link
              href="/compare/qr-codes"
              className="group border border-ink-200 bg-white p-6 hover:border-ink-900"
            >
              <p className="text-lg font-bold">TRAXXR vs QR tools</p>
              <p className="mt-2 text-sm text-ink-500">
                Editable codes, real analytics, and lead capture instead of a
                throwaway image.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#1C6FBE]">
                Compare →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Try it on your next print run.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Put one TRAXXR code on one thing you already print, and see what it
            tells you. Free to start.
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
