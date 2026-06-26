import { createClient } from "@/lib/supabase/server";

// One gate the whole app reads. Maps a workspace's plan + trial + comp state to
// an effective plan and a set of entitlements.

export type PlanKey = "free" | "starter" | "growth" | "agency";

const RANK: Record<PlanKey, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  agency: 3,
};
const DAY = 86_400_000;

export type Entitlements = {
  dynamicCodes: boolean; // create/edit editable codes (the edit-after-print wall)
  bioPageLimit: number; // how many bio pages allowed (Infinity = unlimited)
  analyticsHistory: boolean; // location/device/history vs basic counts
  leadCapture: boolean; // lead forms on codes + bio pages
  emailSync: boolean; // integrations
  shopifyBlocks: boolean; // shoppable bio blocks
  customDomain: boolean; // custom domain on bio pages (Starter+)
  bookingAttribution: boolean; // booking links + placements + funnel (Growth+)
  bulk: boolean; // bulk generation / multiple workspaces
};

export function entitlementsFor(key: PlanKey): Entitlements {
  const r = RANK[key] ?? 0;
  return {
    dynamicCodes: r >= 1,
    bioPageLimit: r >= 1 ? Infinity : 1,
    analyticsHistory: r >= 1,
    leadCapture: r >= 2,
    emailSync: r >= 2,
    shopifyBlocks: r >= 2,
    customDomain: r >= 1,
    bookingAttribution: r >= 2,
    bulk: r >= 3,
  };
}

type WorkspacePlan = {
  plan?: string | null;
  comp?: boolean | null;
  trial_ends_at?: string | null;
} | null;

export function effectivePlan(ws: WorkspacePlan): {
  key: PlanKey;
  trialing: boolean;
  daysLeft: number;
} {
  const base = ((ws?.plan as PlanKey) || "free") as PlanKey;
  // Comped accounts get their granted plan, no trial logic.
  if (ws?.comp) return { key: base, trialing: false, daysLeft: 0 };

  const ends = ws?.trial_ends_at ? new Date(ws.trial_ends_at).getTime() : 0;
  const now = Date.now();
  // The reverse trial only lifts a free workspace to Growth; paid plans ignore it.
  const trialActive = ends > now && base === "free";
  if (trialActive) {
    return {
      key: "growth",
      trialing: true,
      daysLeft: Math.max(1, Math.ceil((ends - now) / DAY)),
    };
  }
  return { key: base, trialing: false, daysLeft: 0 };
}

export type LoadedPlan = {
  userId: string;
  workspaceId: string | null;
  key: PlanKey;
  trialing: boolean;
  daysLeft: number;
  comp: boolean;
  ent: Entitlements;
};

// Server helper: load the current user's effective plan + entitlements.
export async function loadEntitlements(): Promise<LoadedPlan | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, plan, comp, trial_ends_at")
    .eq("owner_id", user.id)
    .maybeSingle();

  const eff = effectivePlan(ws);
  return {
    userId: user.id,
    workspaceId: (ws?.id as string) ?? null,
    key: eff.key,
    trialing: eff.trialing,
    daysLeft: eff.daysLeft,
    comp: Boolean(ws?.comp),
    ent: entitlementsFor(eff.key),
  };
}
