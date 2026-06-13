import { notFound, redirect } from "next/navigation";
import { BioPageView } from "@/components/BioPageView";
import { RESERVED_HANDLES } from "@/lib/reserved";

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

  // The leading "@" can reach us literally ("@name") or percent-encoded
  // ("%40name") depending on how the browser/runtime encodes the path.
  // Decode FIRST so the "@" check is reliable — otherwise an encoded "@"
  // fails startsWith("@"), and we redirect forever, stacking %40s.
  let decoded = rawParam;
  try {
    decoded = decodeURIComponent(rawParam);
  } catch {
    /* malformed encoding — fall back to the raw value */
  }

  const hadAt = decoded.startsWith("@");
  const real = decoded.replace(/^@+/, "").toLowerCase();

  if (!real || RESERVED_HANDLES.has(real)) notFound();

  // A bare /handle canonicalizes to /@handle — exactly one redirect, no loop,
  // because the decoded target now satisfies the @ check on the next request.
  if (!hadAt) redirect(`/@${real}`);

  return <BioPageView handle={real} preview={preview === "1"} />;
}
