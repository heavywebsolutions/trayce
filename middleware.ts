import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Only the dashboard + auth routes need session handling. Public pages (bio
// pages at /handle, redirects at /r /f /l /p, the API) skip middleware entirely.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
