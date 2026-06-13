import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://traxxr.com"),
  title: "Traxxr — turn offline marketing into measurable revenue",
  description:
    "Dynamic QR codes you can edit after they're printed, with scan tracking built for operators.",
  openGraph: {
    title: "Traxxr — turn offline marketing into measurable revenue",
    description:
      "Dynamic QR codes you can edit after they're printed, with scan tracking built for operators.",
    url: "https://traxxr.com",
    siteName: "Traxxr",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
