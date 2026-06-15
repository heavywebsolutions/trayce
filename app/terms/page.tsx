import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service | TRAXXR",
  description: "The terms for using TRAXXR, in plain language.",
};

const sections = [
  {
    h: "Accepting these terms",
    body: [
      "By creating an account or using TRAXXR, you agree to these terms. If you are using TRAXXR for a business, you agree on its behalf.",
    ],
  },
  {
    h: "Your account",
    body: [
      "You are responsible for your account and for what happens under it. Keep your login details safe, and tell us if you think someone else has access.",
    ],
  },
  {
    h: "Acceptable use",
    body: [
      "Do not use TRAXXR for anything illegal, for spam, for malware, or to point codes at content that breaks the law or another person's rights. We can suspend accounts that do.",
    ],
  },
  {
    h: "Plans and payment",
    body: [
      "Paid plans are billed in advance for the period you choose. You can change or cancel your plan at any time, and changes take effect at the next billing cycle. We do not charge a fee on the sales you make through TRAXXR.",
    ],
  },
  {
    h: "Your content and data",
    body: [
      "You own the codes, pages, and leads you create in TRAXXR. You give us the permission we need to host and display that content so the service can run. The leads you collect are yours.",
    ],
  },
  {
    h: "Our intellectual property",
    body: [
      "The TRAXXR software, brand, and design belong to us. Using the service does not give you ownership of any of that.",
    ],
  },
  {
    h: "Third-party services",
    body: [
      "When you connect another tool, such as an email platform or Shopify, your use of that tool is governed by its own terms. We are not responsible for services we do not run.",
    ],
  },
  {
    h: "Availability",
    body: [
      "We work to keep TRAXXR running and reliable, but we provide it as is, without a guarantee that it will be uninterrupted or error free.",
    ],
  },
  {
    h: "Ending the service",
    body: [
      "You can stop using TRAXXR and close your account at any time, and you can export your data first. We can end or suspend access if these terms are broken.",
    ],
  },
  {
    h: "Limitation of liability",
    body: [
      "To the extent the law allows, TRAXXR is not liable for indirect or consequential losses, and our total liability is limited to the amount you paid us in the prior twelve months.",
    ],
  },
  {
    h: "Changes to these terms",
    body: [
      "We may update these terms. When we do, we will change the date below and, for significant changes, do our best to let you know.",
    ],
  },
  {
    h: "Contact",
    body: ["Questions about these terms can go to hello@traxxr.com."],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-ink-400">Last updated June 12, 2026</p>
          <p className="mt-6 text-base leading-relaxed text-ink-500">
            These terms cover how you can use TRAXXR. We have kept them short and
            readable on purpose.
          </p>
          <div className="mt-10 space-y-10">
            {sections.map((s) => (
              <div key={s.h}>
                <h2 className="text-xl font-extrabold tracking-tight">{s.h}</h2>
                <div className="mt-3 space-y-3">
                  {s.body.map((p, i) => (
                    <p
                      key={i}
                      className="text-[15px] leading-relaxed text-ink-500"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
