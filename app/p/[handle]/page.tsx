import { redirect } from "next/navigation";

// Legacy URL — bio pages now live at /@handle. Keep old /p/handle links and
// printed QR codes working by redirecting.
export default async function LegacyBioRedirect({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  redirect(`/@${handle}`);
}
