import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy | Traxxr",
  description:
    "What Traxxr collects, why, and what you can do about it, in plain language.",
};

const sections = [
  {
    h: "Information we collect",
    body: [
      "Account details you give us, such as your name and email address.",
      "Content you create in Traxxr, such as your codes, links, and pages.",
      "Usage and scan data when someone scans a code or clicks a link, which includes the time, the device and browser type, an approximate location, and a hashed version of the IP address. We do not store the raw IP address.",
      "Leads your own visitors submit through your forms. We collect these on your behalf, and you control them.",
      "Credentials for the tools you connect, such as an email platform API key. These are encrypted before they are stored.",
    ],
  },
  {
    h: "How we use it",
    body: [
      "To run the service, show you analytics, and sync leads to the tools you choose.",
      "To keep accounts secure and to prevent abuse.",
      "To understand how the product is used so we can improve it.",
    ],
  },
  {
    h: "How we share it",
    body: [
      "With the service providers that run our infrastructure, such as hosting and database providers, under agreements that limit how they may use it.",
      "With the email tools and integrations you choose to connect, only as needed to deliver the leads you send.",
      "When the law requires it.",
      "We do not sell your personal data.",
    ],
  },
  {
    h: "Data you collect from others",
    body: [
      "If you use Traxxr to capture leads, you are responsible for those contacts. You confirm that you have the right to collect and message them, and that you will honor their requests.",
    ],
  },
  {
    h: "Security",
    body: [
      "Integration credentials are encrypted at rest, access is limited to what is needed to run the service, and traffic is served over HTTPS. No method is perfectly secure, but we work to protect your data.",
    ],
  },
  {
    h: "Cookies",
    body: [
      "We use cookies that are needed to keep you signed in and to understand basic, aggregate usage of the site.",
    ],
  },
  {
    h: "Your choices",
    body: [
      "You can access, export, or delete your data using the tools in your account or by contacting us. We will respond to reasonable requests.",
    ],
  },
  {
    h: "Changes to this policy",
    body: [
      "We will post any updates on this page and change the date below. If a change is significant, we will do our best to let you know.",
    ],
  },
  {
    h: "Contact",
    body: ["Questions about privacy can go to hello@traxxr.com."],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <SiteNav />
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-ink-400">Last updated June 12, 2026</p>
          <p className="mt-6 text-base leading-relaxed text-ink-500">
            This policy explains what Traxxr collects, why we collect it, and the
            choices you have. We try to keep it in plain language instead of legal
            fog.
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
