import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrintProduct } from "@/lib/print/catalog";
import { PrintConfigurePanel } from "@/components/PrintConfigurePanel";

export const dynamic = "force-dynamic";

export default async function ConfigurePrintPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: productKey } = await params;
  const product = getPrintProduct(productKey);
  if (!product) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: codeRows } = await supabase
    .from("codes")
    .select("id, title, slug")
    .eq("workspace_id", ws?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(100);

  const codes = (codeRows ?? []).map((c) => ({
    id: c.id as string,
    title: (c.title as string) ?? null,
    slug: c.slug as string,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/print"
        className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-700"
      >
        ← All products
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {product.name}
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">{product.blurb}</p>
      </div>

      <PrintConfigurePanel product={product} codes={codes} />
    </div>
  );
}
