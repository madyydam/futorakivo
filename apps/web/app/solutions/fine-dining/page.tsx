import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, LayoutGrid, Sparkles, Split, Tablet, Users, UtensilsCrossed } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Fine Dining & Dine-In Restaurant POS Software — KIVO",
  description:
    "Elevate dine-in hospitality with interactive visual floor plans, tableside captain ordering, multi-course KOT pacing, flexible bill splitting, and guest CRM.",
  keywords: [
    "Fine dining restaurant POS",
    "Restaurant table management software",
    "Captain ordering app",
    "Dine-in restaurant billing software",
    "Split bill restaurant POS",
    "Table reservation software",
  ],
  alternates: {
    canonical: "/solutions/fine-dining",
  },
  openGraph: {
    title: "Fine Dining & Dine-In Restaurant POS Software — KIVO",
    description:
      "Interactive table floor plans, handheld captain app, multi-course KOT firing, and split billing for fine dining and casual restaurants.",
    url: "https://www.kivo.futoragroup.in/solutions/fine-dining",
    siteName: "KIVO",
  },
};

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Interactive Floor & Table Layout",
    description:
      "Design your restaurant's physical floor plan with custom table shapes. Color-coded real-time indicators reveal vacant, seated, order-running, and billed tables at a glance.",
  },
  {
    icon: Tablet,
    title: "Tableside Captain Ordering App",
    description:
      "Empower waitstaff to take orders directly at the table on any smartphone or tablet. Send items to the kitchen immediately without walking back and forth to the billing counter.",
  },
  {
    icon: UtensilsCrossed,
    title: "Course Pacing & Special Notes",
    description:
      "Fire starters, main courses, and desserts in paced sequences. Add guest allergen alerts, cooking preferences ('less spicy', 'no onions'), and custom preparation requests per dish.",
  },
  {
    icon: Split,
    title: "Effortless Bill Splitting",
    description:
      "Split bills smoothly by seat, item, or percentage across mixed payment methods including UPI, corporate cards, credit cards, and cash with zero calculation errors.",
  },
  {
    icon: Users,
    title: "Guest CRM & Dining History",
    description:
      "Capture customer birthdays, anniversaries, dining preferences, and lifetime spend to deliver personalized hospitality that turns first-time diners into regulars.",
  },
  {
    icon: CreditCard,
    title: "Table-Side Digital Payments",
    description:
      "Generate dynamic table UPI QR codes on thermal printouts or tablet screens so guests can settle payments right from their seats.",
  },
];

export default function FineDiningSolutionPage() {
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
              Crafted for Fine Dining &amp; Casual Dine-in Restaurants
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Flawless Hospitality with <br className="hidden sm:inline" />
              <span className="text-primary">Interactive Table POS &amp; Captain App</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Delight guests from the moment they are seated. Visual table occupancy, tableside ordering on any tablet, course pacing, and instant split payments.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="h-11 px-6 font-semibold" render={<Link href="/onboarding" />}>
                Start Free Trial
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6" render={<Link href="/demo/tables" />}>
                Explore Table Floor Plan Demo
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
              Transform Your Dine-in Experience
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Empower your captains and kitchen staff with a modern, responsive table management platform.
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
