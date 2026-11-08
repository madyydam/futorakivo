"use client";

import { ArrowRight, Cloud, Layers, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: Cloud,
    title: "Instant Cloud Setup",
    description:
      "Zero servers to install. Access your complete restaurant management platform from any web browser, iPad, Android tablet, or POS terminal in seconds.",
  },
  {
    icon: WifiOff,
    title: "100% Offline Resilience",
    description:
      "Never miss a sale when internet drops. Bill customers, print receipts, and dispatch kitchen tickets uninterrupted even with zero network connectivity.",
  },
  {
    icon: RefreshCw,
    title: "Automatic Cloud Sync",
    description:
      "All offline tickets, payments, customer data, and inventory deductions automatically sync to the cloud server the moment connection is restored.",
  },
  {
    icon: Layers,
    title: "Centralized Management",
    description:
      "Control menus, live revenue, stock costing, staff payroll, and CRM across single or multi-branch chains from one centralized cloud dashboard.",
  },
];

export function InstallSection() {
  return (
    <section id="get-started" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Cloud-Managed SaaS · Offline-First Speed
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Start Managing Your Restaurant in Minutes
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Modexsys HORECA unites modern cloud SaaS flexibility with rugged offline reliability.
          Sign up online and start serving customers immediately.
        </p>
      </Reveal>

      {/* CTA Box */}
      <Reveal delay={0.1} className="mt-8 flex justify-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-[15px]" render={<Link href="/onboarding" />}>
            Create your account free
            <ArrowRight className="size-4 ml-1.5" data-icon="inline-end" />
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-[15px]" render={<Link href="/login" />}>
            Sign in to Dashboard
          </Button>
        </div>
      </Reveal>

      {/* 4 Pillars Grid */}
      <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => (
          <RevealItem key={p.title}>
            <div className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* SaaS Reliability & Performance Highlights */}
      <Reveal delay={0.15} className="mt-14">
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-border/60 sm:p-8">
          <div className="flex flex-col items-center px-4 py-2 text-center">
            <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">99.9%</span>
            <span className="mt-1.5 text-sm font-semibold text-foreground">Cloud Uptime</span>
            <span className="mt-1 text-xs text-muted-foreground">High-availability redundant SaaS clusters</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 text-center">
            <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">0 sec</span>
            <span className="mt-1.5 text-sm font-semibold text-foreground">Offline Lag</span>
            <span className="mt-1 text-xs text-muted-foreground">Instant billing and kitchen printing without internet</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 text-center">
            <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">100%</span>
            <span className="mt-1.5 text-sm font-semibold text-foreground">Auto-Sync</span>
            <span className="mt-1 text-xs text-muted-foreground">Automatic cloud reconciliation on reconnection</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
