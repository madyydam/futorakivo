"use client";

import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PosMockup } from "@/components/marketing/pos-mockup";
import { useCurrentUser } from "@/hooks/use-auth";

const words = ["All-in-one", "cloud", "platform", "for", "restaurants."];

export function Hero() {
  const { data: userData } = useCurrentUser();
  const isLoggedIn = Boolean(userData?.user);

  return (
    <section className="relative overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
      />

      <div className="mx-auto max-w-6xl w-full">
        {/* Side-by-side grid on desktop */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Left: Text & CTA Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary"
            >
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Modexsys HORECA · Cloud SaaS Platform
            </motion.div>

            <h1 className="mt-2.5 flex flex-wrap justify-center gap-x-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:justify-start lg:text-[40px] xl:text-[44px] leading-tight">
              {words.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={word === "restaurants." ? "text-primary font-bold" : undefined}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 max-w-lg text-balance text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
            >
              <strong className="text-foreground font-semibold">Modexsys HORECA</strong> is an
              all-in-one cloud SaaS platform for restaurants and cafés to manage menus, orders, billing,
              finances, and daily operations from one centralized hub. Built with offline-first
              resilience — operations continue seamlessly without internet and auto-sync to the cloud
              once reconnected.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              {isLoggedIn ? (
                <Button size="default" className="h-10 px-5 text-sm" render={<Link href="/dashboard" />}>
                  Open Dashboard
                  <ArrowRight className="size-4 ml-1.5" data-icon="inline-end" />
                </Button>
              ) : (
                <Button size="default" className="h-10 px-5 text-sm" render={<Link href="/signup" />}>
                  Get started free
                  <ArrowRight className="size-4 ml-1.5" data-icon="inline-end" />
                </Button>
              )}

              <Button
                variant="outline"
                size="default"
                className="h-10 px-5 text-sm"
                render={<a href="#live-demo" />}
              >
                <Play className="size-3.5 fill-current text-primary mr-1" data-icon="inline-start" />
                Watch Live Demo
              </Button>
            </motion.div>

            {/* Micro badges below CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.5 }}
              className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground lg:justify-start"
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
