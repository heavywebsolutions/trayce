"use client";

import { useEffect } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Renders the Cloudflare Turnstile widget. If no site key is configured it
// renders nothing, so the form works unchanged until you turn it on. The widget
// injects a hidden "cf-turnstile-response" input into the surrounding form,
// which the server action verifies.
export function Turnstile() {
  useEffect(() => {
    if (!SITE_KEY) return;
    const id = "cf-turnstile-script";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  if (!SITE_KEY) return null;
  return <div className="cf-turnstile" data-sitekey={SITE_KEY} />;
}
