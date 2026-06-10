import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — server-only, never import into client code.
// Used by the redirect engine to log scans and bump counters.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it from Supabase Dashboard > Settings > API."
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
