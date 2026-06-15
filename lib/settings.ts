import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

// Email-automation flags. A missing key means enabled, so flows default ON.
export async function emailFlags(
  admin: Admin
): Promise<Record<string, boolean>> {
  const { data } = await admin
    .from("app_settings")
    .select("key, value")
    .like("key", "email_%");
  const map: Record<string, boolean> = {};
  for (const r of data ?? []) map[r.key as string] = r.value !== false;
  return map;
}

// A flow is on unless explicitly disabled, and the master switch can kill all.
export function flowOn(
  flags: Record<string, boolean>,
  kind: string
): boolean {
  if (flags["email_master"] === false) return false;
  return flags[`email_${kind}`] !== false;
}
