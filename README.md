# Traxxr — V1

Dynamic QR codes you can re-point after they're printed, with scan tracking. This is the
**V1 irreducible loop**: sign up → create a dynamic code → it redirects → edit the destination
anytime → see scans on a dashboard. Built on the locked stack and Stripe-light design system.

- **App:** Next.js (App Router) + TypeScript, deploys to Vercel
- **Data + auth:** Supabase (Postgres + Auth, RLS on)
- **Redirect engine:** Cloudflare Worker (with a built-in Next.js fallback so it runs locally)

The Supabase backend is **already provisioned** (Supabase project name `qr-platform`,
region `us-west-1`). The schema in `supabase/migrations/0001_v1_init.sql` is already applied.
(The app is branded **Traxxr**; the underlying Supabase project keeps its original name — you can
rename it in the Supabase dashboard anytime, it doesn't affect the code.)

---

## What's built (V1)

- Email signup / login / logout; a workspace is auto-created per account.
- Create / pause / archive dynamic codes; each gets a scannable SVG QR.
- **Edit destination after printing** — the core paid mechanic. Change history is kept.
- Redirect engine logs every scan (device, referrer, hashed IP, country) and 302s to the
  *current* destination.
- Dashboard: revenue-led overview (revenue + lifecycle cards reserved/“coming soon”),
  scan counts, recent activity, mobile-first with a thumb-reachable bottom nav.

## Reserved for V2 (data model already supports it)

`attribution_events` table + the Revenue/Lifecycle UI are present but inert, so no migration
is needed later. Not built yet: experimentation engine, lifecycle journeys, Shopify App Store
app, AEO landing-page builder, revenue attribution wiring.

---

## Run it locally

```bash
npm install
# add your service-role key to .env.local (see below), then:
npm run dev
```

Open http://localhost:3000.

`.env.local` is pre-filled with the project URL + publishable key. You only need to add one
secret to enable scan logging locally:

```
SUPABASE_SERVICE_ROLE_KEY=...   # Supabase Dashboard → Project Settings → API → service_role
```

Without it, redirects still work — they just won't log scans.

> Email confirmation: Supabase requires email confirmation by default. For fast local testing,
> turn it off under Supabase → Authentication → Providers → Email (“Confirm email” off), or
> confirm via the link.

---

## Deploy (≈5 minutes — none of it is editing code)

1. **GitHub** — create a private repo, then from this folder:
   ```bash
   git init && git add . && git commit -m "Traxxr V1"
   git remote add origin git@github.com:YOUR_ORG/traxxr.git
   git push -u origin main
   ```
2. **Vercel** — Import the repo. Add env vars from `.env.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_REDIRECT_BASE_URL`). Deploy. Vercel re-deploys on every push.
3. **Cloudflare Worker** (optional in V1 — Vercel's `/r/[code]` route already redirects):
   ```bash
   cd worker
   npm install
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler deploy
   ```
   Then point your short domain at the worker and set `NEXT_PUBLIC_REDIRECT_BASE_URL` to it.

---

## Project structure

```
app/
  (auth)/            login, signup, auth server actions
  dashboard/         overview, codes list, code detail
  r/[code]/          redirect engine (logs scan, 302s)
  api/qr/[slug]/     downloadable SVG
  api/auth/signout/
components/           UI primitives + forms (design system)
lib/
  supabase/          server / client / admin / middleware clients
  qr.ts slug.ts utils.ts types.ts
supabase/migrations/  V1 schema (already applied)
worker/               Cloudflare redirect engine
```

## Notes

- All tables have Row Level Security; users only ever see their own workspace's rows.
- Scan writes happen server-side with the service-role key (bypasses RLS by design).
- Branded as **Traxxr**. (The Supabase project is still named `qr-platform` internally — harmless; rename in the dashboard if you like.)
