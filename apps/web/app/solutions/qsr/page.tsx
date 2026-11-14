import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Sparkles, Store, Utensils, Zap, Printer, Shield } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "QSR & Fast Food Billing Software — Quick Service Restaurant POS",
  description:
    "Ultra-fast 3-tap counter billing, token queue management, barcode scanning, and thermal printing for fast food and quick-service outlets with offline sync.",
  keywords: [
    "QSR POS software",
    "Fast food billing software",
    "Quick service restaurant billing",
    "Cafe POS system",
    "Counter billing software",
    "Token display system",
  ],
  alternates: {
    canonical: "/solutions/qsr",
  },
  openGraph: {
    title: "QSR & Fast Food Billing Software — Quick Service Restaurant POS",
    description:
      "Ultra-fast counter billing and token display designed for high-volume quick-service restaurants and cafes.",
    url: "https://www.kivo.futoragroup.in/solutions/qsr",
    siteName: "KIVO",
  },
};

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-Second 3-Tap Billing",
    description: "Designed for rapid-fire queues. Tap category, select item with modifier, take payment via QR/cash, and auto-print receipt in under 2 seconds.",
  },
  {
    icon: Clock,
    title: "Digital Token & Order Queue",
    description: "Auto-generate sequential order tokens. Display preparation and ready states on customer-facing screens or calling displays.",
  },
  {
    icon: Printer,
    title: "Instant Thermal & KOT Printing",
    description: "Auto-route kitchen tickets to burger, beverage, and dessert stations simultaneously across 2-inch and 3-inch thermal printers.",
  },
  {
    icon: Store,
    title: "Barcode & Quick Item Lookup",
    description: "Scan packaged beverages or retail items with standard USB/Bluetooth barcode scanners for instant addition to the active bill.",
  },
  {
    icon: Shield,
    title: "100% Offline Rush Hour Mode",
    description: "Internet went down during peak lunchtime? Keep billing, printing tokens, and collecting cash without dropping a single order.",
  },
  {
    icon: Utensils,
    title: "Combos & Add-on Upselling",
    description: "Configurable combo prompts (e.g., 'Make it a Meal with Fries & Drink') to boost counter staff average order value effortlessly.",
  },
];

export default function QsrSolutionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(50%_40%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
          />
          <div className="mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Tailored for Quick Service &amp; Fast Food
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              High-Velocity POS Software for <br className="hidden sm:inline" />
              <span className="text-primary">QSRs, Fast Food &amp; Cafes</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Cut counter queues in half. Instant 3-tap checkout, automated token calling, multi-station KOT routing, and rock-solid offline billing.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="h-11 px-6 font-semibold" render={<Link href="/onboarding" />}>
                Start Free Trial
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6" render={<Link href="/demo/pos" />}>
                Try Live POS Terminal Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs hover:border-primary/40 transition-colors">
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground text-base">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 text-center">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-card p-8 sm:p-12 shadow-md">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Speed Up Your Counter Checkout Today
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Experience the difference sub-second billing makes for your QSR or Cafe.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="h-11 px-7 font-semibold" render={<Link href="/onboarding" />}>
                Create Free Account
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
