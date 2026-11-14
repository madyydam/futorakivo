"use client";

import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PosMockup } from "@/components/marketing/pos-mockup";
import { useCurrentUser } from "@/hooks/use-auth";

const words = ["Software", "for", "restaurant", "management,", "simplified."];

export function Hero() {
  const { data: userData } = useCurrentUser();
  const isLoggedIn = Boolean(userData?.user);

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:min-h-[calc(100vh-4rem)] lg:flex lg:items-center">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
      />

      <div className="mx-auto max-w-6xl w-full">
        {/* Side-by-side grid on desktop */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left: Text & CTA Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary"
            >
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              KIVO · Restaurant Management Simplified
            </motion.div>

            <h1 className="mt-4 flex flex-wrap justify-center gap-x-2.5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:justify-start lg:text-5xl xl:text-6xl leading-[1.1]">
              {words.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={word === "simplified." ? "text-primary font-bold" : undefined}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* Ultra-concise, minimal subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              All-in-one cloud software for restaurant management: 3-tap POS billing, kitchen display (KDS), recipe inventory, and offline resilience with cloud auto-sync.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              {isLoggedIn ? (
                <Button size="lg" className="h-11 px-6 text-[15px]" render={<Link href="/dashboard" />}>
                  Open Dashboard
                  <ArrowRight className="size-4 ml-1.5" data-icon="inline-end" />
                </Button>
              ) : (
                <Button size="lg" className="h-11 px-6 text-[15px]" render={<Link href="/onboarding" />}>
                  Get started free
                  <ArrowRight className="size-4 ml-1.5" data-icon="inline-end" />
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className="h-11 px-6 text-[15px]"
                render={<Link href="/demo" />}
              >
                <Play className="size-3.5 fill-current text-primary mr-1" data-icon="inline-start" />
                See Demo
              </Button>
            </motion.div>

            {/* Micro badges below CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.5 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground lg:justify-start"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Cloud SaaS Platform
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Offline Mode &amp; Auto-Sync
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Unified POS &amp; KDS
              </span>
            </motion.div>
          </div>

          {/* Right: Mockup side-by-side */}
          <div className="w-full flex items-center justify-center">
            <PosMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
