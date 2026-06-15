import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrintProduct } from "@/lib/print/catalog";
import { GOOGLE_FONTS_HREF } from "@/lib/print/decal";
import { qrContentFor } from "@/lib/qr";
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
    .select(
      "id, title, slug, design_svg, type, content_type, destination_url, fg_color, bg_color, dot_style, corner_style, logo_url, frame_style, frame_color, frame_text"
    )
    .eq("workspace_id", ws?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(100);

  const codes = (codeRows ?? []).map((c) => ({
    id: c.id as string,
    title: (c.title as string) ?? null,
    slug: c.slug as string,
    design_svg: (c.design_svg as string | null) ?? null,
    destination_url: (c.destination_url as string) ?? "",
    content: qrContentFor({
      type: (c.type as string) ?? "dynamic",
      slug: c.slug as string,
      destination_url: (c.destination_url as string) ?? "",
      content_type: (c.content_type as string) ?? "url",
    }),
    fg_color: (c.fg_color as string) ?? "#0A2540",
    bg_color: (c.bg_color as string) ?? "#FFFFFF",
    dot_style: (c.dot_style as string) ?? "square",
    corner_style: (c.corner_style as string) ?? "square",
    logo_url: (c.logo_url as string | null) ?? null,
    frame_style: (c.frame_style as string) ?? "none",
    frame_color: (c.frame_color as string) ?? "#0A2540",
    frame_text: (c.frame_text as string) ?? "SCAN ME",
  }));

  return (
    <div className="mx-auto max-w-5xl">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
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
        <dl className="mt-4 grid gap-3 rounded-xl border border-ink-200 bg-white p-4 sm:grid-cols-3">
          {[
            { label: "Material", value: product.material },
            { label: "Durability", value: product.durability },
            { label: "Turnaround", value: product.turnaround },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                {s.label}
              </dt>
              <dd className="mt-0.5 text-sm text-ink-700">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <PrintConfigurePanel product={product} codes={codes} />
    </div>
  );
}
