import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles email links (password recovery, and any future email confirmation)
// from our own domain. Supabase sends a token_hash; we verify it here, which
// sets the session, then send the user on to the right page. Routing through
// traxxr.com keeps the link short, branded, and working across devices.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only allow same-site relative redirects, never an external URL.
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Bad or expired link: send them to request a fresh one.
  return NextResponse.redirect(new URL("/forgot", origin));
}
