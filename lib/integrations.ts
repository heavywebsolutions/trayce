import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";

export interface Contact {
  email: string;
  name?: string | null;
  phone?: string | null;
  source?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}

export interface Integration {
  provider: string;
  enabled: boolean;
  api_key: string | null;
  list_id: string | null;
  endpoint: string | null;
}

// Metadata that drives the settings UI.
export const PROVIDERS = [
  {
    key: "klaviyo",
    label: "Klaviyo",
    category: "email",
    fields: [
      { name: "api_key", label: "Private API key (pk_…)", secret: true },
      { name: "list_id", label: "List ID", secret: false },
    ],
  },
  {
    key: "mailchimp",
    label: "Mailchimp",
    category: "email",
    fields: [
      { name: "api_key", label: "API key (ends in -usX)", secret: true },
      { name: "list_id", label: "Audience ID", secret: false },
    ],
  },
  {
    key: "convertkit",
    label: "ConvertKit / Kit",
    category: "email",
    fields: [
      { name: "api_key", label: "API key", secret: true },
      { name: "list_id", label: "Form ID", secret: false },
    ],
  },
  {
    key: "brevo",
    label: "Brevo",
    category: "email",
    fields: [
      { name: "api_key", label: "API key", secret: true },
      { name: "list_id", label: "List ID (optional)", secret: false },
    ],
  },
  {
    key: "webhook",
    label: "Webhook (Zapier / Make / custom)",
    category: "email",
    fields: [{ name: "endpoint", label: "POST URL", secret: false }],
  },
  {
    key: "shopify",
    label: "Shopify",
    category: "commerce",
    fields: [
      { name: "endpoint", label: "Shop domain (xxx.myshopify.com)", secret: false },
      { name: "api_key", label: "Storefront API access token", secret: true },
    ],
  },
] as const;

const timeout = () => AbortSignal.timeout(4000);
const nameParts = (n?: string | null) => {
  const [first, ...rest] = (n || "").trim().split(/\s+/);
  return { first: first || "", last: rest.join(" ") };
};

async function klaviyo(i: Integration, c: Contact) {
  if (!i.api_key || !i.list_id) return;
  const { first, last } = nameParts(c.name);
  const phone = c.phone && /^\+\d{7,15}$/.test(c.phone) ? c.phone : undefined;
  await fetch(
    "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs",
    {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${i.api_key}`,
        revision: "2024-10-15",
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email: c.email,
                    ...(phone ? { phone_number: phone } : {}),
                    ...(first ? { first_name: first } : {}),
                    ...(last ? { last_name: last } : {}),
                    subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } },
                  },
                },
              ],
            },
          },
          relationships: { list: { data: { type: "list", id: i.list_id } } },
        },
      }),
      signal: timeout(),
    }
  );
}

async function mailchimp(i: Integration, c: Contact) {
  if (!i.api_key || !i.list_id) return;
  const dc = i.api_key.split("-")[1];
  if (!dc) return;
  const hash = createHash("md5").update(c.email.toLowerCase()).digest("hex");
  const { first, last } = nameParts(c.name);
  await fetch(
    `https://${dc}.api.mailchimp.com/3.0/lists/${i.list_id}/members/${hash}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${i.api_key}`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email_address: c.email,
        status_if_new: "subscribed",
        merge_fields: { FNAME: first, LNAME: last, PHONE: c.phone || "" },
      }),
      signal: timeout(),
    }
  );
}

async function convertkit(i: Integration, c: Contact) {
  if (!i.api_key || !i.list_id) return;
  const { first } = nameParts(c.name);
  await fetch(`https://api.convertkit.com/v3/forms/${i.list_id}/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: i.api_key,
      email: c.email,
      ...(first ? { first_name: first } : {}),
    }),
    signal: timeout(),
  });
}

async function brevo(i: Integration, c: Contact) {
  if (!i.api_key) return;
  const { first, last } = nameParts(c.name);
  await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": i.api_key,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      email: c.email,
      attributes: {
        ...(first ? { FIRSTNAME: first } : {}),
        ...(last ? { LASTNAME: last } : {}),
        ...(c.phone ? { SMS: c.phone } : {}),
      },
      ...(i.list_id ? { listIds: [Number(i.list_id)] } : {}),
      updateEnabled: true,
    }),
    signal: timeout(),
  });
}

async function webhook(i: Integration, c: Contact) {
  if (!i.endpoint) return;
  await fetch(i.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(c),
    signal: timeout(),
  });
}

function dispatch(i: Integration, c: Contact): Promise<void> {
  switch (i.provider) {
    case "klaviyo":
      return klaviyo(i, c);
    case "mailchimp":
      return mailchimp(i, c);
    case "convertkit":
      return convertkit(i, c);
    case "brevo":
      return brevo(i, c);
    case "webhook":
      return webhook(i, c);
    default:
      return Promise.resolve();
  }
}

// Fan a captured contact out to every enabled integration. Best-effort: a
// failing or slow provider never blocks the lead (which is already saved).
export async function syncContact(
  workspaceId: string,
  contact: Contact
): Promise<void> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }
  const { data: integs } = await admin
    .from("integrations")
    .select("provider, enabled, api_key, list_id, endpoint")
    .eq("workspace_id", workspaceId)
    .eq("enabled", true);
  if (!integs?.length) return;
  // Decrypt secrets only here, in server memory, right before the outbound call.
  await Promise.allSettled(
    (integs as Integration[]).map((i) =>
      dispatch({ ...i, api_key: decryptSecret(i.api_key) }, contact).catch(
        () => {}
      )
    )
  );
}
