import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Product | Traxxr",
  description:
    "Dynamic QR codes, link-in-bio pages, scan analytics, lead capture, and email sync in one account. The thing you print and the link you post finally report to the same dashboard.",
};

const blocks = [
  {
    kicker: "Dynamic and static QR codes",
    h: "Make a code in seconds. Change where it goes for years.",
    p: "Pick from eight types: a website, an app store link, a contact card, wifi, a phone call, a text, an email, or plain text. Style it with your colors, drop your logo in the middle, and add a frame that tells people to scan. Static codes are free for good. Dynamic codes let you change the destination after the code is printed, with no reprint.",
    chips: ["8 code types", "Your colors and logo", "Editable after print", "PNG and SVG export"],
    dark: false,
  },
  {
    kicker: "Link-in-bio pages",
    h: "A branded page for every bio, with the data left in your hands.",
    p: "Give your Instagram, TikTok, or YouTube bio a clean page at traxxr.com and your own handle. Add links, video, products, and an email signup. It does the job of Linktree, except you keep every sale and every contact instead of handing a cut to someone else.",
    chips: ["Your own handle", "Links, video, products", "Email signup", "0% sales fee"],
    dark: true,
  },
  {
    kicker: "Scan and click analytics",
    h: "See what is working while it is still working.",
    p: "Watch scans and clicks as they happen. See unique visitors, device, and location, plus the exact code or link that drove each one. Zoom into a single code or look at your whole account, by day, week, or month, so you can put your money behind what actually pulls.",
    chips: ["Real time", "Location and device", "Unique vs total", "Per code and account-wide"],
    dark: false,
  },
  {
    kicker: "Lead capture and email sync",
    h: "Turn a scan into a contact you own.",
    p: "Add a short form to any code or bio page. The moment someone signs up, the lead is yours. Send it straight into Klaviyo, Mailchimp, ConvertKit, Brevo, or any tool through a webhook, the second it comes in. Prefer a spreadsheet? Export to CSV whenever you like.",
    chips: ["Contacts you own", "Klaviyo, Mailchimp, and more", "Webhook for any tool", "CSV export"],
    dark: true,
  },
  {
    kicker: "Shopify product blocks",
    h: "Sell straight from the page.",
    p: "Drop live Shopify products onto a bio page with the image, price, and a buy button pulled from your store. People go from a scan to a cart without a detour, and your product details stay in sync with Shopify.",
    chips: ["Live product data", "Image and price", "Buy button", "Stays in sync"],
    dark: false,
  },
];

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-12 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
            The product
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            One place for your codes, your links, and the leads they bring in.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Traxxr replaces a QR generator and a separate link-in-bio tool with a
            single account. The thing you print and the link you post finally
            report to the same dashboard.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block bg-[#2587DE] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1C6FBE]"
            >
              Start free →
            </Link>
          </div>
        </div>
      </section>

      {/* Capability bands */}
      {blocks.map((b, i) => (
        <section
          key={b.kicker}
          className={
            b.dark
              ? "bg-ink-900 text-white"
              : i === 0
                ? "border-t border-ink-100 bg-white"
                : "border-y border-ink-100 bg-ink-50"
          }
        >
          <div className="mx-auto max-w-3xl px-6 py-16">
            <p
              className={`text-xs font-bold uppercase tracking-[0.14em] ${
                b.dark ? "text-[#7FB2F2]" : "text-[#1C6FBE]"
              }`}
            >
              {b.kicker}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              {b.h}
            </h2>
            <p
              className={`mt-4 text-base leading-relaxed ${
                b.dark ? "text-white/70" : "text-ink-500"
              }`}
            >
              {b.p}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {b.chips.map((c) => (
                <span
                  key={c}
                  className={`px-3 py-1.5 text-[13px] font-semibold ${
                    b.dark
                      ? "border border-white/15 text-white/80"
                      : "border border-ink-200 bg-white text-ink-700"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            See it for yourself.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink-500">
            Build your first code or bio page in under a minute. Free, no card
            required.
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
