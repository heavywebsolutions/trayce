import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-ink-50">
      <DashboardNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-ink-200 bg-white px-5">
          <span className="text-sm text-ink-400 md:hidden">Trayce</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-500 sm:inline">
              {user.email}
            </span>
            <form action="/api/auth/signout" method="post">
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-5 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
