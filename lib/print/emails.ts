// Transactional order emails for Print & Ship. Plain inline-styled HTML so it
// renders in any client. These are order receipts/updates, not marketing, so
// they are not gated by the campaign on/off flags.

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com"
).replace(/\/$/, "");

function shell(
  heading: string,
  paragraphs: string[],
  ctaText: string,
  ctaHref: string
): string {
  return `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:8px 4px;color:#0A2540">
    <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
    ${paragraphs
      .map(
        (p) =>
          `<p style="font-size:15px;line-height:1.6;color:#425466;margin:0 0 14px">${p}</p>`
      )
      .join("")}
    <p style="margin:20px 0 8px">
      <a href="${ctaHref}" style="display:inline-block;background:#2587DE;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">${ctaText}</a>
    </p>
    <p style="font-size:12px;color:#8792A2;margin-top:24px">TRAXXR · Print &amp; Ship</p>
  </div>`;
}

export function proofReadyEmail(opts: {
  orderId: string;
  productName: string;
}): { subject: string; html: string } {
  return {
    subject: `Your ${opts.productName} proof is ready to review`,
    html: shell(
      "Your proof is ready",
      [
        `Thanks for your order. We have prepared a digital proof of your ${opts.productName.toLowerCase()}.`,
        "Review and approve it so we can start production. Nothing prints until you approve, so take a close look at the code, logo, and text.",
      ],
      "Review your proof",
      `${APP_URL}/dashboard/orders/${opts.orderId}`
    ),
  };
}

export function shippedEmail(opts: {
  orderId: string;
  productName: string;
  tracking?: string | null;
  trackingUrl?: string | null;
}): { subject: string; html: string } {
  const paras = [
    `Good news, your ${opts.productName.toLowerCase()} is on the way.`,
  ];
  if (opts.tracking) {
    paras.push(
      opts.trackingUrl
        ? `Tracking number: <a href="${opts.trackingUrl}" style="color:#2587DE">${opts.tracking}</a>`
        : `Tracking number: <strong>${opts.tracking}</strong>`
    );
  }
  return {
    subject: `Your ${opts.productName} has shipped`,
    html: shell(
      "Your order shipped",
      paras,
      "View your order",
      `${APP_URL}/dashboard/orders/${opts.orderId}`
    ),
  };
}
