# Traxxr backlog

Parked ideas and pre-launch items. Not in priority order.

## Product ideas (future)
- **Portrait countertop sign layout.** A true full-bleed portrait artwork for the
  Countertop signs product (logo top, large QR, big headline, colored URL pill at
  the bottom), like the pizza-shop reference. Today signs reuse the square decal
  compositor centered on a portrait board, which is clean but not full-bleed.

## Bot / account protection (before driving real traffic)
In code already: honeypot on the signup form and the contact form, plus a
timing trap on the contact form. The two strong layers below are Supabase
dashboard settings, not code, and should be turned on before launch:
- **Email confirmation.** Supabase → Authentication → Providers/Email: require
  users to confirm their email before the account is usable. Kills most bot
  signups (they cannot verify). Make sure the confirmation email sender/domain
  is set up.
- **Cloudflare Turnstile CAPTCHA.** Supabase → Authentication → Bot &amp; abuse
  protection: enable Turnstile (free, invisible). Then add the Turnstile widget
  token to the signup/login forms and pass it to Supabase auth calls. (Small code
  follow-up once the keys exist.)
- Optional later: rate-limit public endpoints (lead forms, scan redirects, bio
  pages) to stop spam submissions and inflated scan counts.

## Pre-launch (operational, mostly outside the app)
- Stripe go-live: switch to live keys, complete business + bank details, re-create
  the webhook endpoint in live mode, verify the signing secret in Vercel.
- Stripe Billing settings: enable Smart Retries, card-expiry emails, and the Card
  Account Updater.
- Add the two new webhook events in live mode: invoice.payment_failed,
  invoice.payment_succeeded.
- Real Print & Ship pricing (replace placeholder tiers) plus shipping + tax.
- Production-ready print files: bleed, cut lines, outlined fonts.
- Object storage for uploaded print logos (bio images already use storage).
- Verify the Resend sending domain.
- Set Vercel env: ADMIN_EMAILS, RESEND_API_KEY, EMAIL_FROM, CRON_SECRET, STRIPE_* keys.
