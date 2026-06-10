import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-card">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> V1 — the
        irreducible loop
      </span>
      <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
        Your offline marketing should earn its keep.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-ink-500">
        Create dynamic QR codes you can edit after they&apos;re printed, and see
        exactly how many scans each one drives. Revenue attribution comes next.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link href="/signup">
          <Button>Start free</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Log in</Button>
        </Link>
      </div>
    </main>
  );
}
