import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Use cases | Traxxr",
  description:
    "How restaurants, retail, real estate, events, local services, and online brands use Traxxr to track what their printed marketing does and capture leads they own.",
};

const cases = [
  {
    name: "Restaurants and cafes",
    p: "A code on the table tent opens the menu, and the one on the receipt invites a review or a loyalty signup. See which tables and locations drive the most scans, and turn regulars into a list you can message.",
    chips: ["Menus", "Reviews", "Loyalty signups"],
  },
  {
    name: "Retail and boutiques",
    p: "A code on the window, the hangtag, or the shopping bag turns a passerby or a buyer into a follower and a contact. Point it at a new drop today and a sale next week without printing anything new.",
    chips: ["Window displays", "Hangtags", "Packaging"],
  },
  {
    name: "Real estate",
    p: "A sign rider code opens the listing, books a showing, or saves your contact card to a phone. See which listings and signs pull the most interest, and capture buyers before they wander off.",
    chips: ["Sign riders", "Listings", "Contact cards"],
  },
  {
    name: "Events and venues",
    p: "Codes on the badge, the banner, or the printed program point to schedules, maps, or signup forms. You see what people actually opened, so next year you print more of what worked.",
    chips: ["Badges", "Signage", "Programs"],
  },
  {
    name: "Local services",
    p: "A code on the truck, the flyer, or the door hanger books an appointment and captures the lead, even while you are on a job. Trades, gyms, and salons use it to turn local print into booked work.",
    chips: ["Vehicle wraps", "Flyers", "Door hangers"],
  },
  {
    name: "Online and DTC brands",
    p: "A code on the packaging or the insert sends buyers to a review, a reorder, or your bio page, and that bio page can sell straight from Shopify. Connect the unboxing moment to a second purchase.",
    chips: ["Package inserts", "Bio pages", "Shopify blocks"],
  },
];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            Use cases
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            If you print it or post it, Traxxr can track it.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            The product is the same across every business. What changes is what
            you put a code on. Here is how different shops put it to work.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-px border border-ink-200 bg-ink-200 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <div key={c.name} className="flex flex-col bg-white p-6">
                <h2 className="text-lg font-extrabold tracking-tight">
                  {c.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">
                  {c.p}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.chips.map((chip) => (
                    <span
                      key={chip}
                      className="border border-ink-200 px-2.5 py-1 text-[12px] font-semibold text-ink-600"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find your version of this.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Put one code on one thing you already print, and watch what it tells
            you. Free to start.
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
