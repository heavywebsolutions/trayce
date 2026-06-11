import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, Button, Input, Label } from "@/components/ui";
import { PROVIDERS } from "@/lib/integrations";
import { saveIntegration, deleteIntegration } from "./actions";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase.from("integrations").select("*");
  const byProvider = new Map(
    (rows ?? []).map((r: Record<string, unknown>) => [r.provider as string, r])
  );

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
