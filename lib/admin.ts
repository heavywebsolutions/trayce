// Simple admin allowlist for the internal fulfillment back office.
// Set ADMIN_EMAILS in the server env as a comma-separated list, e.g.
//   ADMIN_EMAILS=ops@traxxr.com,you@traxxr.com
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "New",
  printing: "Printing",
  shipped: "Shipped",
  canceled: "Canceled",
};

export function orderStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
