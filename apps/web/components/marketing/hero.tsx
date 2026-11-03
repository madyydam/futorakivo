"use client";

import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PosMockup } from "@/components/marketing/pos-mockup";
import { useCurrentUser } from "@/hooks/use-auth";

const words = ["HORECA", "software", "you", "actually", "own."];

export function Hero() {
  const { data: userData } = useCurrentUser();
  const isLoggedIn = Boolean(userData?.user);

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
      />

      <div className="mx-auto max-w-6xl w-full">
        {/* Side-by-side grid on desktop */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-14">
          {/* Left: Text & CTA Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary"
            >
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Modexsys HORECA · Offline-First Restaurant Operating System
            </motion.div>

            <h1 className="mt-4 flex flex-wrap justify-center gap-x-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:justify-start lg:text-5xl xl:text-6xl">
              {words.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={word === "own." ? "text-primary font-bold" : undefined}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              <strong className="text-foreground font-semibold">Modexsys HORECA</strong> unites high-speed POS billing,
              live Kitchen Display (KDS), interactive floor tables, inventory costing, staff attendance, and CRM into one
              self-hosted local LAN stack. Zero internet dependency, zero recurring fees.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              {isLoggedIn ? (
                <Button size="lg" className="h-11 px-6 text-[15px]" render={<Link href="/dashboard" />}>
                  Open Dashboard
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Button>
              ) : (
                <Button size="lg" className="h-11 px-6 text-[15px]" render={<Link href="/signup" />}>
                  Get started free
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className="h-11 px-6 text-[15px]"
                render={<a href="#live-demo" />}
              >
                <Play className="size-3.5 fill-current text-primary" data-icon="inline-start" />
                Watch Live Demo
              </Button>
            </motion.div>

            {/* Micro badges below CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground lg:justify-start"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> 100% Offline LAN
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Self-Hosted Privacy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Thermal POS &amp; KDS
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