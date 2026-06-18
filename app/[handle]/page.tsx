import { notFound } from "next/navigation";
import { BioPageView } from "@/components/BioPageView";
import { RESERVED_HANDLES } from "@/lib/reserved";
import { normalizeHandle } from "@/lib/handle";

export const dynamic = "force-dynamic";

// Bio pages live ONLY at /@handle. The leading @ is the namespace: a bare path
// (no @) is never treated as a handle, so it falls through to a static route or
// 404. This guarantees content/marketing pages at the root can never collide
// with bio handles, with no reserved-list upkeep needed for routing.
export default async function HandlePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { handle: rawParam } = await params;
  const { preview } = await searchParams;

  // Pure + unit-tested in tests/handle.test.ts.
  const { hadAt, handle: real } = normalizeHandle(rawParam);

  // No leading @ means it isn't a handle; 404 (a static route would have been
  // served before reaching here). Reserved names are never handles either.
  if (!hadAt || !real || RESERVED_HANDLES.has(real)) notFound();

  return <BioPageView handle={real} preview={preview === "1"} />;
}
