import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "About | TRAXXR",
  description:
    "Online marketing has counted every click for years. The flyer, the sign, and the sticker have been flying blind. We built TRAXXR to fix that.",
};

const beliefs = [
  {
    h: "Your data is yours.",
    p: "Export your leads or sync them anywhere, anytime. We never rent your own list back to you.",
  },
  {
    h: "No fees on your sales.",
    p: "We charge for the software, not for what you make. Zero percent of your revenue, on every plan.",
  },
  {
    h: "Honest software.",
    p: "We only claim what the product does today. When something is on the way, we say so plainly instead of dressing it up.",
  },
  {
    h: "Built for operators.",
    p: "Real businesses that print, post, and sell. Not a lab, not a forty-person marketing department.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            About
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            We built TRAXXR because offline marketing deserved better than a
            guess.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Online marketing has known what works for years. Every click gets
            counted. The flyer, the sign, the sticker, and the business card have
            been flying blind. We thought that was backwards, so we set out to fix
            it.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-3xl space-y-10 px-6 py-16">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              The gap we kept running into
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-500">
              A business spends real money on physical marketing and a bio link,
              then has no idea which piece did anything. The tools that could tell
              them were split across two apps with two bills, and one of them
              quietly took a slice of every sale. We kept thinking there had to be
              a cleaner way to run this.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              What we decided to build
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-500">
              One account that turns anything you print into a trackable, editable
              code, gives every social bio a page worth clicking, and keeps every
              lead and every sale with the person who earned it. Simple enough for
              a one-person shop, useful enough for an agency running thirty
              clients.
            </p>
          </div>
        </div>
      </section>

      {/* Beliefs */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-2xl font-extrabold tracking-tight sm:text-3xl">
            What we believe
          </h2>
          <div className="grid gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2">
            {beliefs.map((b) => (
              <div key={b.h} className="bg-white p-6">
                <h3 className="text-[15px] font-bold text-ink-900">{b.h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{b.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where we are */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Where we are now
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-500">
            TRAXXR is young and growing, shaped day by day by the businesses using
            it right now. If you have a feature you need or a rough edge to report,
            we want to hear it. The roadmap is built from what real operators ask
            for, not what sounds good in a pitch.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Get in touch
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Come see what your marketing actually does.
          </h2>
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
