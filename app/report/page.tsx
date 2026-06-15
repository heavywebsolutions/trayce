import Link from "next/link";
import { submitReport } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ handle?: string; sent?: string }>;
}) {
  const { handle, sent } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-10">
      <div className="rounded-2xl border border-ink-200 bg-white p-7">
        <Link
          href="/"
          className="text-sm font-semibold text-accent hover:underline"
        >
          Traxxr
        </Link>

        {sent ? (
          <>
            <h1 className="mt-4 text-xl font-semibold text-ink-900">
              Thanks for letting us know
            </h1>
            <p className="mt-2 text-sm text-ink-600">
              Our team will review this page. We take reports seriously and act
              on anything that breaks our rules. You can close this tab.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-xl font-semibold text-ink-900">
              Report a page
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Tell us what is wrong with{" "}
              {handle ? (
                <span className="font-semibold text-ink-700">@{handle}</span>
              ) : (
                "this page"
              )}
              . Reports are confidential.
            </p>

            <form action={submitReport} className="mt-5 space-y-4">
              <input type="hidden" name="handle" value={handle ?? ""} />

              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">
                  Reason
                </label>
                <select
                  name="reason"
                  className="min-h-[44px] w-full rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
                  defaultValue="spam"
                >
                  <option value="spam">Spam or scam</option>
                  <option value="abuse">Harassment or abuse</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="illegal">Illegal or harmful content</option>
                  <option value="other">Something else</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">
                  Details <span className="text-ink-400">(optional)</span>
                </label>
                <textarea
                  name="details"
                  rows={4}
                  placeholder="Anything that helps us understand the problem."
                  className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">
                  Your email <span className="text-ink-400">(optional)</span>
                </label>
                <input
                  name="reporter"
                  type="email"
                  placeholder="So we can follow up if needed"
                  className="min-h-[44px] w-full rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
                />
              </div>

              <button className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover">
                Submit report
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
