import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUrl } from "@/lib/utils";
import { Card } from "@/components/ui";
import { BookingCaptureForm } from "@/components/BookingCaptureForm";

export const dynamic = "force-dynamic";

// The optional capture interstitial. Reached only when a booking link has lead
// capture on (the tap was already logged by /b/[slug]). One quick step, then we
// forward to the business's real booker. Never a dead end: anything off and we
// send the visitor straight to the booker.
export default async function BookingCapturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect("/");
  }

  type LinkLite = {
    name: string;
    destination_url: string;
    capture_lead: boolean;
    capture_collect_phone: boolean;
    status: string;
  };
  const { data } = await admin
    .from("booking_placements")
    .select(
      "slug, status, booking_links(name, destination_url, capture_lead, capture_collect_phone, status)"
    )
    .eq("slug", slug)
    .maybeSingle();
  const placement = data as unknown as
    | { slug: string; status: string; booking_links: LinkLite | LinkLite[] | null }
    | null;

  const link = Array.isArray(placement?.booking_links)
    ? placement?.booking_links[0]
    : placement?.booking_links;

  if (!placement || placement.status === "archived" || !link) redirect("/");
  const dest = normalizeUrl(link.destination_url || "/");
  // Capture off or link archived: skip straight to the booker.
  if (!link.capture_lead || link.status === "archived") redirect(dest);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <Card className="p-7 text-center">
          <h1 className="text-xl font-semibold text-ink-900">{link.name}</h1>
          <p className="mb-6 mt-1 text-sm text-ink-500">
            Add your details and we&apos;ll take you to booking.
          </p>
          <BookingCaptureForm
            slug={slug}
            destination={dest}
            collectPhone={Boolean(link.capture_collect_phone)}
          />
        </Card>
        <p className="mt-4 text-center text-xs text-ink-400">
          Powered by{" "}
          <a
            href="https://traxxr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
          >
            TRAXXR
          </a>
        </p>
      </div>
    </main>
  );
}
