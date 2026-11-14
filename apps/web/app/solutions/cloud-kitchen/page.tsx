import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, ChefHat, Flame, Layers, Network, RefreshCw, Sparkles, Zap } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cloud Kitchen & Multi-Brand POS Software — KIVO",
  description:
    "Manage multi-brand cloud kitchens, ghost kitchens, and dark kitchens. Streamline orders, recipe-level inventory, multi-station KDS, and real-time food cost analytics.",
  keywords: [
    "Cloud kitchen POS software",
    "Ghost kitchen management software",
    "Multi-brand cloud kitchen POS",
    "Dark kitchen billing software",
    "Cloud kitchen inventory software",
    "Swiggy Zomato POS integration",
  ],
  alternates: {
    canonical: "/solutions/cloud-kitchen",
  },
  openGraph: {
    title: "Cloud Kitchen & Multi-Brand POS Software — KIVO",
    description:
      "Manage multiple virtual brands from one kitchen with automated KDS routing, recipe costing, and real-time inventory depletion.",
    url: "https://www.kivo.futoragroup.in/solutions/cloud-kitchen",
    siteName: "KIVO",
  },
};

const FEATURES = [
  {
    icon: Layers,
    title: "Multi-Brand Unified Dashboard",
    description:
      "Operate multiple virtual brands from a single kitchen footprint. Accept orders, manage menus, and monitor separate P&L statements without juggling multiple screens.",
  },
  {
    icon: ChefHat,
    title: "Multi-Station KDS Routing",
    description:
      "Auto-route order items to distinct kitchen prep stations (fryer, tandoor, assembly, beverage) with color-coded timers, prep alerts, and dispatch tokens.",
  },
  {
    icon: Boxes,
    title: "Gram-Level Recipe Inventory",
    description:
      "Every burger or bowl sold automatically depletes raw ingredients in real time. Track yield wastage, recipe margins, and get low-stock replenishment alerts.",
  },
  {
    icon: Network,
    title: "Aggregator & Direct Order Hub",
    description:
      "Consolidate online delivery channels and direct takeaway phone orders into one clean kitchen queue with unified rider dispatch timestamps.",
  },
  {
    icon: Zap,
    title: "Instant Menu & 86 Item Toggling",
    description:
      "Mark ingredients out of stock with one tap to immediately update active order options across all linked virtual brands and prevent customer cancellations.",
  },
  {
    icon: RefreshCw,
    title: "Cloud Centralized Outlets",
    description:
      "Expanding from 1 cloud kitchen to 10 hubs? Centrally push recipes, base ingredient rates, and employee permissions from one master cloud console.",
  },
];

export default function CloudKitchenSolutionPage() {
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
              Engineered for Cloud Kitchens &amp; Multi-Brand Operators
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Operating System for <br className="hidden sm:inline" />
              <span className="text-primary">Cloud Kitchens &amp; Virtual Brands</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Run 5+ virtual brands from one kitchen. Automatic prep station routing, gram-level recipe inventory deductions, and lightning-fast rider handoff.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="h-11 px-6 font-semibold" render={<Link href="/onboarding" />}>
                Start Free Trial
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6" render={<Link href="/demo/kds" />}>
                Preview Live KDS Screen
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
              Scale Your Cloud Kitchen Operations
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Cut prep delays, stop ingredient leakage, and unify virtual brand fulfillment with KIVO.
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
