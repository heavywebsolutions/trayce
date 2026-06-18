import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { Card, Button, Input, Label } from "@/components/ui";
import {
  EMAILS,
  EMAIL_KINDS,
  ctaHrefFor,
  renderEmail,
  type EmailKind,
} from "@/lib/lifecycle";
import { saveEmailTemplate, resetEmailTemplate } from "../actions";

export const dynamic = "force-dynamic";

export default async function EmailEditor({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ saved?: string; reset?: string; err?: string }>;
}) {
  const { kind: kindRaw } = await params;
  const sp = await searchParams;
  if (!EMAIL_KINDS.includes(kindRaw as EmailKind)) notFound();
  const kind = kindRaw as EmailKind;
  const meta = EMAILS[kind];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) notFound();

  const admin = createAdminClient();
  const { data: override } = await admin
    .from("email_templates")
    .select("subject, heading, body, cta_text")
    .eq("kind", kind)
    .maybeSingle();

  const cur = override
    ? {
        subject: override.subject as string,
        heading: override.heading as string,
        body: override.body as string,
        ctaText: (override.cta_text as string) ?? "",
      }
    : meta.defaults;
  const customized = Boolean(override);
  const vars = meta.vars;

  // Live preview = exactly what would send right now (with sample merge values).
  const preview = await renderEmail(admin, kind, {
    daysLeft: 3,
    cardLabel: "Visa ending 4242",
    expLabel: "08/2026",
    productName: "Holographic decals",
    orderId: "ord_demo123",
    email: "newuser@example.com",
    tracking: "1Z999AA10123456784",
    trackingUrl: "https://example.com/track",
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/admin"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Back to admin
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {meta.label} email
          </h1>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              customized
                ? "border-blue-100 bg-accent-soft text-accent"
                : "border-ink-200 bg-ink-50 text-ink-500"
            }`}
          >
            {customized ? "Customized" : "Default copy"}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-ink-500">
          Edit the wording. Styling, the button link, and the merge values are
          handled for you.
        </p>
      </div>

      {sp.saved && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Saved. This copy is now live for the {meta.label.toLowerCase()} email.
        </div>
      )}
      {sp.reset && (
        <div className="mb-4 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
          Reset to the built-in default copy.
        </div>
      )}
      {sp.err && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Every field is required. Nothing was saved.
        </div>
      )}

      <Card className="mb-5 p-6">
        <form action={saveEmailTemplate} className="space-y-4">
          <input type="hidden" name="kind" value={kind} />
          <div>
            <Label htmlFor="subject">Subject line</Label>
            <Input id="subject" name="subject" defaultValue={cur.subject} required />
          </div>
          <div>
            <Label htmlFor="heading">Heading</Label>
            <Input id="heading" name="heading" defaultValue={cur.heading} required />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <textarea
              id="body"
              name="body"
              defaultValue={cur.body}
              rows={7}
              required
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink-900 outline-none focus:border-accent-ring focus:ring-2 focus:ring-accent-ring/30"
            />
            <p className="mt-1 text-xs text-ink-400">
              Separate paragraphs with a blank line.
            </p>
          </div>
          {meta.hasCta ? (
            <div>
              <Label htmlFor="cta_text">Button text</Label>
              <Input id="cta_text" name="cta_text" defaultValue={cur.ctaText} required />
              <p className="mt-1 text-xs text-ink-400">
                Button links to{" "}
                <span className="font-mono text-ink-500">
                  {ctaHrefFor(kind, { orderId: "{orderId}" })}
                </span>{" "}
                (fixed, so it can&apos;t break).
              </p>
            </div>
          ) : (
            <p className="text-xs text-ink-400">
              This email has no button. It is a plain notification.
            </p>
          )}

          {vars.length > 0 && (
            <div className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3">
              <p className="text-xs font-medium text-ink-600">
                Auto-filled placeholders you can use:
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {vars.map((v) => (
                  <span
                    key={v}
                    className="rounded-md border border-ink-200 bg-white px-2 py-0.5 font-mono text-xs text-accent"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit">Save changes</Button>
          </div>
        </form>

        {customized && (
          <form action={resetEmailTemplate} className="mt-3 border-t border-ink-100 pt-3">
            <input type="hidden" name="kind" value={kind} />
            <button className="text-sm font-medium text-ink-500 underline-offset-2 hover:text-red-600 hover:underline">
              Reset to default copy
            </button>
          </form>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-ink-900">Preview</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Exactly what sends now. Placeholders shown with sample values.
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-400">
          Subject
        </p>
        <p className="mb-3 text-sm font-medium text-ink-900">{preview.subject}</p>
        <div className="overflow-hidden rounded-xl border border-ink-200">
          <iframe
            title="Email preview"
            srcDoc={preview.html}
            className="h-[340px] w-full bg-white"
          />
        </div>
      </Card>
    </div>
  );
}
