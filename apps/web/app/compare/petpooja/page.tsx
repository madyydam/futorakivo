import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight, Zap, ShieldCheck, RefreshCw, Smartphone, Sparkles, HelpCircle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "KIVO vs Petpooja — The Modern Cloud Restaurant POS Alternative",
  description:
    "Compare KIVO vs Petpooja. Discover why modern restaurants switch to KIVO for lightning-fast billing, zero proprietary hardware lock-in, and reliable offline cloud sync.",
  keywords: [
    "KIVO vs Petpooja",
    "Petpooja alternative",
    "Best restaurant POS software India",
    "Restaurant billing software",
    "Petpooja comparison",
    "Offline restaurant POS",
  ],
  alternates: {
    canonical: "/compare/petpooja",
  },
  openGraph: {
    title: "KIVO vs Petpooja — Modern Cloud Restaurant POS Alternative",
    description:
      "Looking for a modern alternative to Petpooja? Compare KIVO's lightning-fast billing, hardware freedom, and offline auto-sync.",
    url: "https://www.kivo.futoragroup.in/compare/petpooja",
    siteName: "KIVO",
  },
};

const COMPARISON_ROWS = [
  {
    feature: "Billing Speed",
    kivo: "Sub-second 3-tap checkout engineered for extreme rush hours",
    petpooja: "Standard legacy interface, occasional input delay under load",
    kivoWin: true,
  },
  {
    feature: "Hardware Freedom",
    kivo: "Run on any iPad, Android tablet, phone, PC, or existing POS terminal",
    petpooja: "Often tied to specific vendor POS machines or Windows terminals",
    kivoWin: true,
  },
  {
    feature: "Offline Resilience",
    kivo: "100% offline billing with automatic cloud reconciliation on reconnect",
    petpooja: "Offline mode supported but can encounter desktop sync conflicts",
    kivoWin: true,
  },
  {
    feature: "Kitchen Display (KDS)",
    kivo: "Built-in real-time color-coded KDS stations with station routing",
    petpooja: "Separate add-on module with additional setup fees",
    kivoWin: true,
  },
  {
    feature: "Modern Cloud Architecture",
    kivo: "Next-gen web stack with instant edge loading & zero local server setup",
    petpooja: "Older client-server architecture requiring local runtime maintenance",
    kivoWin: true,
  },
  {
    feature: "Multi-Outlet Management",
    kivo: "Centralized menu, pricing, stock transfers, and branch analytics",
    petpooja: "Centralized dashboard available via separate chain portal",
    kivoWin: true,
  },
  {
    feature: "Instant Test-Drive Demo",
    kivo: "Live interactive demo available online immediately without signup",
    petpooja: "Requires scheduling a sales rep call and waiting for credentials",
    kivoWin: true,
  },
];

export default function ComparePetpoojaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(50%_40%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
          />
          <div className="mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Comprehensive Platform Comparison
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              KIVO vs Petpooja: <br className="hidden sm:inline" />
              <span className="text-primary">Why Modern Restaurants Switch</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Looking for a faster, modern cloud restaurant POS without hardware lock-in? See how KIVO compares side-by-side with Petpooja.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="h-11 px-6 font-semibold" render={<Link href="/onboarding" />}>
                Start Free Trial
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6" render={<Link href="/demo" />}>
                Explore Live Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="grid grid-cols-12 bg-muted/60 p-4 sm:p-5 border-b border-border/70 text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <div className="col-span-5 sm:col-span-4">Feature / Capability</div>
              <div className="col-span-4 sm:col-span-4 text-primary font-extrabold flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                KIVO (Cloud SaaS)
              </div>
              <div className="col-span-3 sm:col-span-4 text-slate-500 dark:text-slate-400">Petpooja</div>
            </div>

            <div className="divide-y divide-border/60">
              {COMPARISON_ROWS.map((row) => (
                <div key={row.feature} className="grid grid-cols-12 p-4 sm:p-5 items-center gap-2 text-xs sm:text-sm hover:bg-muted/30 transition-colors">
                  <div className="col-span-5 sm:col-span-4 font-semibold text-foreground">
                    {row.feature}
                  </div>
                  <div className="col-span-4 sm:col-span-4 text-foreground font-medium flex items-start gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{row.kivo}</span>
                  </div>
                  <div className="col-span-3 sm:col-span-4 text-muted-foreground">
                    {row.petpooja}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 Core Differentiators */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-foreground">
            The KIVO Advantage
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Zap className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground text-base">Lightning-Fast 3-Tap Billing</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Zero lag during rush hours. Modifiers, split payments, table transfers, and discounts apply instantly without spinning loaders.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground text-base">Zero Hardware Lock-In</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Don't buy expensive proprietary terminals. Use standard iPads, Android tablets, laptops, and ESC/POS thermal printers.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RefreshCw className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground text-base">Rock-Solid Offline Sync</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Never lose a sale during internet outages. Take orders and print receipts offline; transactions auto-reconcile with cloud on reconnect.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 text-center">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-card p-8 sm:p-12 shadow-md">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to Upgrade Your Restaurant Operations?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Join modern restaurants who chose speed, reliability, and cloud flexibility with KIVO.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="h-11 px-7 font-semibold" render={<Link href="/onboarding" />}>
                Get Started Free in 60s
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6" render={<Link href="/demo" />}>
                Launch Interactive Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
