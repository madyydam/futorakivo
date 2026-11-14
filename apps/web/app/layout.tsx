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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.kivo.futoragroup.in"),
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
    url: "https://www.kivo.futoragroup.in",
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
      "@id": "https://www.kivo.futoragroup.in/#software",
      name: "KIVO",
      url: "https://www.kivo.futoragroup.in",
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
      "@id": "https://www.kivo.futoragroup.in/#organization",
      name: "KIVO",
      url: "https://www.kivo.futoragroup.in",
      logo: "https://www.kivo.futoragroup.in/logo.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.kivo.futoragroup.in/#website",
      url: "https://www.kivo.futoragroup.in",
      name: "KIVO",
      publisher: {
        "@id": "https://www.kivo.futoragroup.in/#organization",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.kivo.futoragroup.in/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is KIVO and who is it designed for?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KIVO is a modern all-in-one cloud restaurant management platform and point-of-sale (POS) SaaS. It is purpose-built for fine dining restaurants, cafes, quick-service counters (QSR), restobars, and multi-brand cloud kitchens to streamline billing, kitchen order tickets (KOT), inventory recipe costing, and floor operations.",
          },
        },
        {
          "@type": "Question",
          name: "How does KIVO's offline mode work during internet outages?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KIVO runs with full offline-first resilience. If your internet drops during rush hours, your staff can continue creating orders, printing thermal receipts and kitchen tickets, and billing customers without interruption. All sales, payments, and stock movements are cached securely and automatically reconcile with the cloud the instant connectivity returns.",
          },
        },
        {
          "@type": "Question",
          name: "How does KIVO compare to older systems like Petpooja or POSist?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KIVO delivers the power of a modern cloud platform without hardware lock-in or clunky interfaces. You can run KIVO on any device — iPads, Android tablets, desktop browsers, or specialized POS hardware. You get lightning-fast 3-tap billing, modern Kitchen Display System (KDS) routing, and centralized real-time analytics without expensive proprietary hardware.",
          },
        },
        {
          "@type": "Question",
          name: "Does KIVO support GST billing and thermal receipt printers in India?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, KIVO is fully compliant with Indian GST requirements, supporting SGST, CGST, IGST, HSN codes, and tax-inclusive pricing. It connects directly with standard 2-inch (58mm) and 3-inch (80mm) ESC/POS thermal receipt printers via USB, Bluetooth, and network LAN (port 9100).",
          },
        },
        {
          "@type": "Question",
          name: "Can I manage multi-outlet restaurant chains and central inventory?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. KIVO's centralized cloud dashboard allows multi-outlet operators to manage menus, push standardized pricing, monitor live branch revenue, and transfer stock between central commissaries and retail outlets with role-based access controls.",
          },
        },
        {
          "@type": "Question",
          name: "How do I get started with KIVO?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can test drive the system directly through our interactive live demo without signing in, or create your restaurant account in under 60 seconds with our free cloud trial.",
          },
        },
      ],
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
