import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, Button, Input, Label } from "@/components/ui";
import { PROVIDERS } from "@/lib/integrations";
import { encryptionConfigured } from "@/lib/crypto";
import { saveIntegration, deleteIntegration } from "./actions";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Never fetch the secret into the page — only what we need to render status.
  const { data: rows } = await supabase
    .from("integrations")
    .select("provider, enabled, list_id, endpoint");
  const byProvider = new Map(
    (rows ?? []).map((r: Record<string, unknown>) => [r.provider as string, r])
  );
  const encrypted = encryptionConfigured();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Integrations
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Auto-sync every captured contact — code leads, bio forms, and
          subscribers — into your email tools in real time.
        </p>
      </div>

      <div
        className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          encrypted
            ? "border-emerald-100 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        {encrypted ? (
          <>
            🔒 Keys are encrypted at rest (AES-256-GCM) with a server-only key.
            They&apos;re never shown in this page, sent to the browser, or
            written to logs.
          </>
        ) : (
          <>
            ⚠️ <code>ENCRYPTION_KEY</code> isn&apos;t set in your environment, so
            saved keys would be stored unencrypted. Add it (see README) before
            connecting anything sensitive.
          </>
        )}
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((p) => {
          const current = byProvider.get(p.key) as
            | Record<string, unknown>
            | undefined;
          const connected = Boolean(current);
          const enabled = (current?.enabled as boolean) ?? false;
          return (
            <Card key={p.key} className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-ink-900">
                  {p.label}
                </h2>
                {connected ? (
                  <Badge tone={enabled ? "green" : "gray"}>
                    {enabled ? "Connected" : "Paused"}
                  </Badge>
                ) : (
                  <Badge tone="gray">Not connected</Badge>
                )}
              </div>

              <form action={saveIntegration} className="space-y-3">
                <input type="hidden" name="provider" value={p.key} />
                {p.fields.map((f) => (
                  <div key={f.name}>
                    <Label htmlFor={`${p.key}-${f.name}`}>{f.label}</Label>
                    <Input
                      id={`${p.key}-${f.name}`}
                      name={f.name}
                      type={f.secret ? "password" : "text"}
                      defaultValue={
                        f.secret
                          ? ""
                          : ((current?.[f.name] as string) ?? "")
                      }
                      placeholder={
                        f.secret && connected
                          ? "•••••••• saved (leave blank to keep)"
                          : undefined
                      }
                    />
                  </div>
                ))}

                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={connected ? enabled : true}
                    className="accent-[#4F46E5]"
                  />
                  Enabled
                </label>

                <div className="flex items-center gap-2">
                  <Button type="submit">
                    {connected ? "Update" : "Connect"}
                  </Button>
                  {connected && (
                    <button
                      formAction={deleteIntegration}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </form>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Not on any of these? Your contacts are always exportable as CSV from the
        Leads page. · Keys are stored per workspace and only visible to you.
      </p>
    </div>
  );
}
