import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://kivo.futora.com"),
  title: {
    default: "KIVO — Cloud Restaurant Management Platform & POS",
    template: "%s | KIVO",
  },
  description:
    "KIVO is an all-in-one cloud restaurant POS and management SaaS with lightning-fast billing, kitchen display (KDS), inventory recipe costing, and offline resilience with cloud auto-sync.",
  keywords: [
    "Restaurant POS software",
    "Cloud restaurant management SaaS",
    "Restaurant billing software",
    "Kitchen Display System KDS",
    "Petpooja alternative",
    "Restaurant inventory management",
    "Offline POS with cloud sync",
    "QSR billing software",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "KIVO — Cloud Restaurant Management Platform & POS",
    description:
      "All-in-one cloud restaurant management SaaS and POS with offline resilience, kitchen display, and automatic sync.",
    url: "https://kivo.futora.com",
    siteName: "KIVO",
    images: [
      {
        url: "/brand-lockup.png",
        width: 1200,
        height: 630,
        alt: "KIVO Cloud Restaurant Management Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KIVO — Cloud Restaurant Management Platform & POS",
    description:
      "All-in-one cloud restaurant management SaaS and POS with offline resilience, kitchen display, and automatic sync.",
    images: ["/brand-lockup.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  verification: {
    google: "hECFKBPwQf_lW-vfcqA7_xYodGYNUmu8DGNz89EvjGY",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://kivo.futora.com/#software",
      name: "KIVO",
      url: "https://kivo.futora.com",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android, Windows, macOS",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        description: "Free trial available",
      },
      description:
        "All-in-one cloud restaurant POS and management SaaS featuring fast billing, kitchen display system (KDS), inventory recipe management, and offline resilience with cloud auto-sync.",
      featureList: [
        "Cloud Restaurant POS Billing",
        "Kitchen Display System (KDS)",
        "Inventory & Recipe Costing",
        "Offline-First Auto Sync",
        "Table Management & Floor Layout",
        "GST Invoicing & Analytics",
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://kivo.futora.com/#organization",
      name: "KIVO",
      url: "https://kivo.futora.com",
      logo: "https://kivo.futora.com/logo.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://kivo.futora.com/#website",
      url: "https://kivo.futora.com",
      name: "KIVO",
      publisher: {
        "@id": "https://kivo.futora.com/#organization",
      },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#9f1239",
  // Lets the bottom nav / sheets sit inside the notch + home-indicator safe areas.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
