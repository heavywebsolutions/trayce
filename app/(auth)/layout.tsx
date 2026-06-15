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
          className="mb-8 flex items-center justify-center text-ink-900"
        >
          <img src="/traxxr-logo.png" alt="TRAXXR" className="h-7 w-auto" />
        </Link>
        {children}
      </div>
    </main>
  );
}
