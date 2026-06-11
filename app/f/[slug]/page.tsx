import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui";
import { LeadForm } from "@/components/LeadForm";

export const dynamic = "force-dynamic";

export default async function LeadFormPage({
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

  const { data: code } = await admin
    .from("codes")
    .select(
      "slug, status, action_type, destination_url, lead_headline, lead_subtext, lead_button, lead_collect_name, lead_collect_phone, lead_success_message"
    )
    .eq("slug", slug)
    .maybeSingle();

  // If it's not a lead form (or missing), fall back to its destination or home.
  if (!code || code.status === "archived") redirect("/");
  if (code.action_type !== "lead") redirect(code.destination_url || "/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <Card className="p-7">
          <h1 className="text-xl font-semibold text-ink-900">
            {code.lead_headline}
          </h1>
          {code.lead_subtext && (
            <p className="mb-6 mt-1 text-sm text-ink-500">{code.lead_subtext}</p>
          )}
          <LeadForm
            slug={code.slug}
            button={code.lead_button}
            collectName={code.lead_collect_name}
            collectPhone={code.lead_collect_phone}
            successMessage={code.lead_success_message}
          />
        </Card>
        <p className="mt-4 text-center text-xs text-ink-400">
          Powered by Trayce
        </p>
      </div>
    </main>
  );
}
