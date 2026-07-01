import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "TRAXXR for tattoo shops | See what books the session",
  description:
    "TRAXXR wraps the booker your shop already uses so a scan from your portfolio, window, or bio turns into a booked client you can measure and keep. Built for tattoo shops and artists.",
};

const problems = [
  {
    h: "You don't know what books",
    p: "One client says they saw it on Instagram, the next says the window. You are guessing which piece, which sign, which post actually fills the chair.",
  },
  {
    h: "Your booker hides your clients",
    p: "Square, Acuity, and Booksy take the booking but keep the client's contact. When a slot opens up, you have no easy list to text.",
  },
  {
    h: "DM tag eats your day",
    p: "People screenshot your work and slide into the DMs to book. You end up playing message tag instead of tattooing.",
  },
];

const steps = [
  {
    n: "1",
    h: "Point a code at your booker",
    p: "Paste the booking link you already use. TRAXXR turns it into a scannable, re-pointable QR, no new calendar to learn.",
  },
  {
    n: "2",
    h: "Tag every spot",
    p: "One code for your portfolio, one for the window, one for your bio. Each gets its own QR, so every placement is tracked on its own.",
  },
  {
    n: "3",
    h: "Watch what books",
    p: "See taps, captured clients, and which placement drives real sessions. Grab the client's info before they hand off to your booker.",
  },
];

const features = [
  {
    h: "Portfolio attribution",
    p: "Know which piece, which sign, and which channel sends people to book, side by side.",
  },
  {
    h: "Capture the client first",
    p: "An optional one-step name and email before the hand-off, so you own the contact even when your booker won't share it.",
  },
  {
    h: "Own your list",
    p: "Every captured client lands in one inbox and can sync to Mailchimp, Klaviyo, or your tools for fill-ins and reminders.",
  },
  {
    h: "Scan-to-book cards",
    p: "Order printed cards and decals with your code already on them, shipped to the shop and ready for the counter.",
  },
  {
    h: "One link in bio",
    p: "A branded page for your links, portfolio, and booker that you can update anytime without touching your bio.",
  },
  {
    h: "Re-point anytime",
    p: "Change where a printed code goes without reprinting. New booker, new drop, same sticker on the window.",
  },
];

const surfaces = [
  "Portfolio wall",
  "Shop window",
  "Business cards",
  "Chair-side card",
  "Instagram bio",
  "Aftercare card",
];

export default function TattooShopsPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            For tattoo shops and artists
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Your portfolio books sessions. Now you will know which pieces.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            TRAXXR wraps the booker your shop already uses, Square, Acuity,
            Booksy, Calendly, so a scan from your portfolio, window, or bio
            turns into a booked client you can measure and keep. No switching, no
            new calendar to learn.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-[#2587DE] px-7 py-3 text-sm font-semibold text-white hover:bg-[#1C6FBE]"
            >
              Start free →
            </Link>
            <Link
              href="/product"
              className="border border-ink-200 px-7 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            Booked out, but flying blind
          </h2>
          <div className="mt-10 grid gap-px border border-ink-200 bg-ink-200 md:grid-cols-3">
            {problems.map((c) => (
              <div key={c.h} className="flex flex-col bg-white p-6">
                <h3 className="text-lg font-extrabold tracking-tight">{c.h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            How it works
          </p>
          <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            Three steps, zero reprints
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="bg-white p-6 shadow-card">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2587DE] text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight">
                  {s.h}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            Everything a shop needs to fill the chair
          </h2>
          <div className="mt-10 grid gap-px border border-ink-200 bg-ink-200 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.h} className="flex flex-col bg-white p-6">
                <h3 className="text-base font-extrabold tracking-tight">{f.h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Surfaces */}
      <section className="border-t border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Put a code on anything you already print
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink-500">
            Same tool, different surface. Each one tells you what it drove.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {surfaces.map((s) => (
              <span
                key={s}
                className="border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Outcome / CTA band */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Fill the chair, and keep the client.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Print one code next to one piece and watch what it books. Free to
            start, and it works with the booker you already have.
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
