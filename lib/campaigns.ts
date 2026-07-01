// Registry of campaign + landing pages that live at the root (outside the main
// nav). Powers the admin "Campaign Pages" view so every special URL is in one
// place. Add a new lander here and it shows up automatically.

export type CampaignPage = {
  title: string;
  path: string; // e.g. "/vip-access"
  description: string;
  category: "Vertical" | "Campaign" | "Ambassador";
  visibility: "public" | "unlisted"; // unlisted = noindex / not linked from the site
};

export const CAMPAIGN_PAGES: CampaignPage[] = [
  {
    title: "Tattoo shops",
    path: "/for/tattoo-shops",
    description:
      "Vertical landing page for tattoo shops and artists, led by Booking attribution.",
    category: "Vertical",
    visibility: "public",
  },
  {
    title: "VIP access",
    path: "/vip-access",
    description: "Early-access prospect landing page.",
    category: "Campaign",
    visibility: "unlisted",
  },
  {
    title: "Deviant ambassadors",
    path: "/deviant-ambassadors",
    description:
      "Private ambassador recruitment lander. Hidden from search (noindex).",
    category: "Ambassador",
    visibility: "unlisted",
  },
];

export function campaignUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com").replace(
    /\/$/,
    ""
  );
  return `${base}${path}`;
}
