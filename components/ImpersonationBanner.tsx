import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { IMP_COOKIE, verifyImpersonator } from "@/lib/impersonation";
import { stopImpersonation } from "@/app/dashboard/admin/actions";

// Persistent banner shown whenever an admin is impersonating ("logged in as")
// another account, with a one-click exit back to the admin session.
export async function ImpersonationBanner() {
  const cookieStore = await cookies();
  const adminEmail = verifyImpersonator(cookieStore.get(IMP_COOKIE)?.value);
  if (!adminEmail) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <span className="text-amber-800">
        You are viewing as{" "}
        <strong>{user?.email ?? "this account"}</strong>. Changes you make affect
        their account.
      </span>
      <form action={stopImpersonation}>
        <button className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700">
          Exit impersonation
        </button>
      </form>
    </div>
  );
}
