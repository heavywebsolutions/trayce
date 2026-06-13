import { notFound, redirect } from "next/navigation";
import { BioPageView } from "@/components/BioPageView";
import { RESERVED_HANDLES } from "@/lib/reserved";
import { normalizeHandle } from "@/lib/handle";

export const dynamic = "force-dynamic";

// Bio pages live at /@handle (canonical). A bare /handle redirects to the @ form.
export default async function HandlePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { handle: rawParam } = await params;
  const { preview } = await searchParams;

  // Normalize once. Pure + unit-tested in tests/handle.test.ts so the
  // redirect-loop bug can never come back.
  const { hadAt, handle: real } = normalizeHandle(rawParam);

  if (!real || RESERVED_HANDLES.has(real)) notFound();

  // A bare /handle canonicalizes to /@handle — exactly one redirect, no loop,
  // because the decoded target now satisfies the @ check on the next request.
  if (!hadAt) redirect(`/@${real}`);

  return <BioPageView handle={real} preview={preview === "1"} />;
}
