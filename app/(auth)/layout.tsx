import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-ink-900"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-sm font-bold text-white">
            T
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Trayce
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}
