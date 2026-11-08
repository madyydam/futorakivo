"use client";

import { MotionConfig } from "motion/react";
import { Features } from "@/components/marketing/features";
import { Hero } from "@/components/marketing/hero";
import { InstallSection } from "@/components/marketing/install-section";
import { LiveSystemDemo } from "@/components/marketing/live-system-demo";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { SecuritySection } from "@/components/marketing/security-section";

export default function MarketingHomePage() {
  return (
    // reducedMotion="user" makes every Motion animation on this page defer
    // to the OS prefers-reduced-motion setting automatically (transforms
    // swap for instant/opacity-only changes) instead of threading
    // useReducedMotion() through every component individually.
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-full flex-col">
        <MarketingNav />
        <main id="main-content">
          <Hero />
          <section id="showcase">
            <ProductShowcase />
          </section>
          <Features />
          {/* Section 4: Live System Interactive / Animated Dashboard Simulation */}
          <LiveSystemDemo />
          <section id="security">
            <SecuritySection />
          </section>
          <section id="get-started">
            <InstallSection />
          </section>
        </main>
        <MarketingFooter />
      </div>
    </MotionConfig>
  );
}
