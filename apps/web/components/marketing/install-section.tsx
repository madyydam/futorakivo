"use client";

import { ArrowRight, HardDrive, Server, WifiOff, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: HardDrive,
    title: "Runs on Your Own Machine",
    description:
      "Install on any laptop, PC, or mini-PC in your restaurant. One Docker Compose command and KIVO is live on port 1995 — no cloud account, no signup required.",
  },
  {
    icon: WifiOff,
    title: "100% Offline Operation",
    description:
      "Bill customers, print receipts, and dispatch kitchen tickets with zero internet. Order-taking, KDS, and printing never depend on a WAN connection.",
  },
  {
    icon: Server,
    title: "Your Data, Your Server",
    description:
      "All orders, customer records, inventory, and payroll live in PostgreSQL on your own machine. Nothing leaves your premises unless you choose to push it.",
  },
  {
    icon: Layers,
    title: "Multi-Device on Local Wi-Fi",
    description:
      "Every tablet, KDS screen, and billing terminal on your restaurant Wi-Fi connects to the one server. Unlimited devices — no per-terminal licence fees ever.",
  },
];

export function InstallSection() {
  return (
    <section id="get-started" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Self-Hosted · Offline-First · Free Forever
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Up and Running in Under 5 Minutes
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          KIVO installs with one command on any Windows, macOS, or Linux machine.
          No cloud account. No subscription. Your restaurant data stays on your server.
        </p>
        <div className="mt-6 mx-auto max-w-xl rounded-xl border border-border/60 bg-muted/40 px-5 py-4 text-left font-mono text-sm text-muted-foreground">
          <span className="text-primary select-none">$ </span>
          git clone https://github.com/madyydam/futorakivo.git
          <br />
          <span className="text-primary select-none">$ </span>
          cd futorakivo {'&&'} ./install.sh
          <br />
          <span className="text-emerald-500">✓ KIVO running at http://localhost:1995</span>
        </div>
      </Reveal>

      {/* CTA Box */}
      <Reveal delay={0.1} className="mt-8 flex justify-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-[15px]" render={<Link href="/onboarding" />}>
            Set up your restaurant
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

      {/* Key stats — self-hosted angle */}
      <Reveal delay={0.15} className="mt-14">
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-border/60 sm:p-8">
          <div className="flex flex-col items-center px-4 py-2 text-center">
            <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">₹0</span>
            <span className="mt-1.5 text-sm font-semibold text-foreground">Subscription Cost</span>
            <span className="mt-1 text-xs text-muted-foreground">Free & open-source forever under AGPL</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 text-center">
            <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">0 sec</span>
            <span className="mt-1.5 text-sm font-semibold text-foreground">Offline Lag</span>
            <span className="mt-1 text-xs text-muted-foreground">Instant billing and kitchen printing without internet</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 text-center">
            <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">100%</span>
            <span className="mt-1.5 text-sm font-semibold text-foreground">Your Data</span>
            <span className="mt-1 text-xs text-muted-foreground">Stored locally on your server — never on our cloud</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
