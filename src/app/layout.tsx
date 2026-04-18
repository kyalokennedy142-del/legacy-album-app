import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

/* ── Fonts ────────────────────────────────────── */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Serif display font for headings — matches the luxury brand tone
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

/* ── Metadata ─────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "The Legacy Album Project",
    template: "%s | Legacy Album",
  },
  description:
    "Transform your digital memories into premium, leather-bound heirloom albums. Preserve your story — beautifully.",
  keywords: [
    "photo album",
    "heirloom album",
    "memory preservation",
    "leather photo book",
    "Kenya",
    "Africa",
  ],
  authors: [{ name: "The Legacy Album Project" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://legacyalbum.co.ke"
  ),
  openGraph: {
    type: "website",
    siteName: "The Legacy Album Project",
    title: "The Legacy Album Project",
    description:
      "Premium leather-bound photo albums that preserve your memories for generations.",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Legacy Album Project",
    description:
      "Premium leather-bound photo albums that preserve your memories for generations.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)",  color: "#0e0c0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

/* ── Root layout ──────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ${cormorant.variable}
        h-full
        antialiased
      `}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}