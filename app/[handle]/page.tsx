import { notFound, redirect } from "next/navigation";
import { BioPageView } from "@/components/BioPageView";
import { RESERVED_HANDLES } from "@/lib/reserved";

export const dynamic = "force-dynamic";

// Bio pages live at /@handle (canonical). A bare /handle redirects to the @ form.
export default async function HandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  if (!handle.startsWith("@")) {
    if (RESERVED_HANDLES.has(handle.toLowerCase())) notFound();
    redirect(`/@${handle}`);
  }

  const real = handle.slice(1).toLowerCase();
  if (!real || RESERVED_HANDLES.has(real)) notFound();
  return <BioPageView handle={real} />;
}
