import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact | Traxxr",
  description:
    "Reach the Traxxr team for support, agency and reseller questions, or anything else.",
};

const reasons = [
  {
    h: "Support",
    p: "Stuck on something, found a bug, or have an idea? We read every message and reply fast.",
    email: "hello@traxxr.com",
  },
  {
    h: "Agencies and resellers",
    p: "Running codes and bio pages for a roster of clients? Ask about the Agency plan and how partners work with us.",
    email: "hello@traxxr.com",
  },
  {
    h: "Press and partnerships",
    p: "Writing about Traxxr or want to work together? Send the details and we will get back to you.",
    email: "hello@traxxr.com",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            Contact
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Talk to a human.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            No ticket maze and no bot runaround. Email us and a real person on the
            team will answer.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-px border border-ink-200 bg-ink-200 md:grid-cols-3">
            {reasons.map((r) => (
              <div key={r.h} className="bg-white p-6">
                <h2 className="text-lg font-extrabold tracking-tight">{r.h}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{r.p}</p>
                <a
                  href={`mailto:${r.email}`}
                  className="mt-4 inline-block text-sm font-semibold text-[#1C6FBE] hover:underline"
                >
                  {r.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Or just try it.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            The fastest way to see if Traxxr fits is to make a code. It is free
            and takes about a minute.
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
