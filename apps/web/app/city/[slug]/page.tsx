import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPin,
  Printer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  WifiOff,
  Zap,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

interface CityConfig {
  slug: string;
  cityName: string;
  region: string;
  state: string;
  headline: string;
  tagline: string;
  description: string;
  popularDining: string[];
  localFeatures: {
    icon: typeof Zap;
    title: string;
    description: string;
  }[];
  keywords: string[];
}

const CITIES: Record<string, CityConfig> = {
  mumbai: {
    slug: "mumbai",
    cityName: "Mumbai",
    region: "MMR (Mumbai Metropolitan Region)",
    state: "Maharashtra",
    headline: "Restaurant POS & Billing Software in Mumbai",
    tagline: "Engineered for high-density Mumbai rush hours, 3-tap rapid billing, and uninterrupted offline sync.",
    description:
      "From high-footfall QSRs in Dadar and Bandra to bustling restobars in Lower Parel, KIVO provides Mumbai restaurants with sub-second billing, tableside captain ordering, and multi-station KDS without hardware lock-in.",
    popularDining: [
      "Bustling QSR Counters & Street Food Hubs",
      "Marine Drive & Bandra Cafes",
      "Lower Parel Restobars & Breweries",
      "Multi-Brand Cloud Kitchens in Andheri",
      "Fine Dining in South Mumbai",
    ],
    localFeatures: [
      {
        icon: Zap,
        title: "Peak Hour Rush Velocity",
        description: "Process orders in under 2 seconds. Zero lag during high-density lunchtime queues and weekend dinner surges across Mumbai.",
      },
      {
        icon: WifiOff,
        title: "100% Offline Resilience",
        description: "Keep billing, firing kitchen tickets, and printing receipts even if Wi-Fi or broadband drops. All data auto-syncs to the cloud on reconnect.",
      },
      {
        icon: Printer,
        title: "Universal Thermal Printing",
        description: "Direct USB, Bluetooth, and LAN printing on standard 2-inch and 3-inch thermal printers without proprietary device lock-in.",
      },
    ],
    keywords: [
      "Restaurant POS software in Mumbai",
      "Restaurant billing software Mumbai",
      "Best restaurant POS software Mumbai",
      "Cafe billing software Mumbai",
      "Cloud kitchen POS Mumbai",
      "Bar and restobar billing system Mumbai",
    ],
  },
  "delhi-ncr": {
    slug: "delhi-ncr",
    cityName: "Delhi NCR",
    region: "Delhi, Gurgaon & Noida",
    state: "Delhi NCR",
    headline: "Restaurant Management & Billing Software in Delhi NCR",
    tagline: "Powering CP fine dining, Cyber Hub microbreweries, and high-traffic food courts across Delhi NCR.",
    description:
      "Purpose-built for the fast-paced NCR food industry. Manage multi-course dining, floor plans, aggregator deliveries, and central commissary stock across Connaught Place, Gurgaon, and Noida.",
    popularDining: [
      "Cyber Hub & Sector 29 Microbreweries",
      "Connaught Place Heritage Diners",
      "Noida & Gurgaon Cloud Kitchen Hubs",
      "Mall Food Courts & QSR Counters",
      "South Delhi Specialty Cafes",
    ],
    localFeatures: [
      {
        icon: UtensilsCrossed,
        title: "Visual Table Floor Plans & Captain App",
        description: "Live table occupancy tracking, multi-course KOT pacing (starters, mains, desserts), and instant tableside ordering on any tablet or smartphone.",
      },
      {
        icon: Building2,
        title: "Multi-Outlet Chain Management",
        description: "Control multiple outlets across Delhi, Gurgaon, and Noida from one central cloud console with standardized menus and live revenue dashboards.",
      },
      {
        icon: Smartphone,
        title: "Zero Hardware Lock-In",
        description: "Run on standard iPads, Android tablets, laptops, and desktop computers without investing in costly proprietary POS terminals.",
      },
    ],
    keywords: [
      "Restaurant billing software Delhi NCR",
      "Restaurant POS software Delhi",
      "Cloud kitchen POS Gurgaon",
      "Cafe POS software Noida",
      "Restaurant management software Connaught Place",
      "Best POS system Delhi NCR",
    ],
  },
  bangalore: {
    slug: "bangalore",
    cityName: "Bengaluru",
    region: "Bengaluru Urban",
    state: "Karnataka",
    headline: "Modern Cloud Restaurant POS in Bengaluru",
    tagline: "The tech-first restaurant operating system for craft breweries, Koramangala cafes, and Indiranagar kitchens.",
    description:
      "Modern Bengaluru diners expect speed, digital QR payments, and flawless hospitality. KIVO gives Bengaluru restaurateurs a modern, edge-cloud POS stack with instant offline reconciliation.",
    popularDining: [
      "Indiranagar & Koramangala Craft Breweries",
      "Specialty Coffee Cafes & Bakeries",
      "Whitefield & Electronic City Tech-Park Diners",
      "HSR Layout Virtual & Ghost Kitchens",
      "Lavelle Road Premium Casual Restaurants",
    ],
    localFeatures: [
      {
        icon: Zap,
        title: "Modern Edge Cloud Architecture",
        description: "Lightning-fast page loads, real-time WebSockets synchronization, and built-in REST & MCP developer integrations for modern tech-savvy operators.",
      },
      {
        icon: Smartphone,
        title: "Dynamic Table UPI QR Payments",
        description: "Generate instantaneous dynamic UPI payment QRs right on the table bill printout for frictionless guest self-checkout.",
      },
      {
        icon: WifiOff,
        title: "Resilient Offline Operation",
        description: "Operate offline seamlessly during local network interruptions with automatic reconciliation to the central cloud upon reconnection.",
      },
    ],
    keywords: [
      "Restaurant POS software Bangalore",
      "Restaurant billing software Bengaluru",
      "Brewery POS software Bangalore",
      "Cafe management software Koramangala",
      "Indiranagar restaurant billing POS",
      "Best cloud POS software Bangalore",
    ],
  },
  pune: {
    slug: "pune",
    cityName: "Pune",
    region: "Pune Metropolitan",
    state: "Maharashtra",
    headline: "Restaurant POS & Billing Software in Pune",
    tagline: "Streamlined counter and dine-in management for FC Road cafes, KP restobars, and Hinjawadi eateries.",
    description:
      "Pune is home to a thriving cafe culture and fast-paced tech dining. KIVO delivers sub-second counter checkouts, student loyalty programs, and recipe-level stock management for Pune's food businesses.",
    popularDining: [
      "FC Road & JM Road Student Cafes",
      "Koregaon Park Restobars & Lounges",
      "Hinjawadi IT Corridor Quick Service Outlets",
      "Baner & Balewadi High Street Diners",
      "Kothrud & Viman Nagar Cloud Kitchens",
    ],
    localFeatures: [
      {
        icon: Zap,
        title: "Sub-Second 3-Tap Counter Billing",
        description: "Designed for rapid-fire counter queues. Select items, add modifiers, take payment via QR or cash, and auto-print receipts in seconds.",
      },
      {
        icon: UtensilsCrossed,
        title: "Recipe-Level Raw Material Tracking",
        description: "Every coffee, burger, or dish sold automatically depletes raw ingredients in real time to stop leakage and control food costs.",
      },
      {
        icon: ShieldCheck,
        title: "Split Billing & Flexible Payments",
        description: "Effortlessly split bills among friends by seat or equal share across cash, card, and UPI without calculation errors.",
      },
    ],
    keywords: [
      "Restaurant billing software Pune",
      "Restaurant POS software in Pune",
      "Cafe billing software FC Road Pune",
      "Koregaon Park restobar POS software",
      "Best restaurant billing software Pune",
      "Cloud POS system Pune",
    ],
  },
  hyderabad: {
    slug: "hyderabad",
    cityName: "Hyderabad",
    region: "Hyderabad & Secunderabad",
    state: "Telangana",
    headline: "High-Turnover Restaurant POS Software in Hyderabad",
    tagline: "Empowering legendary Biryani houses, Jubilee Hills fine dining, and Hitec City delivery hubs.",
    description:
      "Engineered to withstand massive table turnover and high-volume delivery queues. KIVO provides Hyderabad restaurateurs with multi-station KDS routing, token display calling, and comprehensive GST compliance.",
    popularDining: [
      "High-Volume Traditional Biryani Houses",
      "Jubilee Hills & Banjara Hills Fine Dining",
      "Hitec City & Gachibowli QSR Counters",
      "Madhapur Multi-Brand Ghost Kitchens",
      "Charminar & Secunderabad Heritage Eateries",
    ],
    localFeatures: [
      {
        icon: Zap,
        title: "High-Turnover Table Management",
        description: "Handle hundreds of orders per hour without slowdown. Fast table turnarounds with quick-clear states and instant bill generation.",
      },
      {
        icon: Printer,
        title: "Multi-Station Kitchen Display & KOT",
        description: "Auto-route biryani, tandoor, curry, and beverage tickets to dedicated kitchen displays and thermal printers simultaneously.",
      },
      {
        icon: ShieldCheck,
        title: "Complete GST & Invoicing Compliance",
        description: "Full support for CGST, SGST, IGST, HSN codes, and daily tax summary reports compliant with Telangana commercial tax standards.",
      },
    ],
    keywords: [
      "Restaurant POS software Hyderabad",
      "Restaurant billing software Hyderabad",
      "Biryani house POS software",
      "Cloud kitchen software Hitec City Hyderabad",
      "Best restaurant billing system Hyderabad",
      "Jubilee Hills restaurant POS",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(CITIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = CITIES[slug];
  if (!city) return {};

  return {
    title: `${city.headline} — KIVO`,
    description: city.description,
    keywords: city.keywords,
    alternates: {
      canonical: `/city/${city.slug}`,
    },
    openGraph: {
      title: `${city.headline} — KIVO`,
      description: city.description,
      url: `https://www.kivo.futoragroup.in/city/${city.slug}`,
      siteName: "KIVO - Restaurant Management Simplified",
    },
  };
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = CITIES[slug];

  if (!city) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `https://www.kivo.futoragroup.in/city/${city.slug}#service`,
        name: `KIVO Restaurant POS Software in ${city.cityName}`,
        serviceType: "Restaurant Management Software & Cloud POS",
        provider: {
          "@type": "Organization",
          name: "FUTORA GROUP OF COMPANIES",
          url: "https://www.kivo.futoragroup.in",
        },
        areaServed: {
          "@type": "City",
          name: city.cityName,
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: city.state,
          },
        },
        description: city.description,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav />

      <main className="flex-1">
        {/* City Hero */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(50%_40%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
          />
          <div className="mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <MapPin className="size-3.5 text-primary" />
              Tailored for {city.cityName} &amp; {city.region}
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {city.headline}
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              {city.tagline}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="h-11 px-6 font-semibold" render={<Link href="/onboarding" />}>
                Start Free Trial in {city.cityName}
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6" render={<Link href="/demo" />}>
                Try Interactive Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Local Features */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-foreground">
            Why {city.cityName} Restaurateurs Choose KIVO
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {city.localFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground text-base">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Dining Categories in City */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-foreground">
              Built for Every Food &amp; Beverage Format in {city.cityName}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Whether you operate a single fast-casual counter or a multi-location restaurant chain:
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {city.popularDining.map((dining) => (
                <div key={dining} className="flex items-center gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>{dining}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 text-center">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-card p-8 sm:p-12 shadow-md">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Elevate Your {city.cityName} Restaurant Operations
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Switch to faster billing, zero hardware lock-in, and reliable cloud sync with KIVO.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="h-11 px-7 font-semibold" render={<Link href="/onboarding" />}>
                Get Started Free in 60s
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
