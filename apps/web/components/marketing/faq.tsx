"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

export const FAQS = [
  {
    question: "What is KIVO and who is it designed for?",
    answer:
      "KIVO is a modern all-in-one cloud restaurant management platform and point-of-sale (POS) SaaS. It is purpose-built for fine dining restaurants, cafes, quick-service counters (QSR), restobars, and multi-brand cloud kitchens to streamline billing, kitchen order tickets (KOT), inventory recipe costing, and floor operations.",
  },
  {
    question: "How does KIVO's offline mode work during internet outages?",
    answer:
      "KIVO runs with full offline-first resilience. If your internet drops during rush hours, your staff can continue creating orders, printing thermal receipts and kitchen tickets, and billing customers without interruption. All sales, payments, and stock movements are cached securely and automatically reconcile with the cloud the instant connectivity returns.",
  },
  {
    question: "How does KIVO compare to older systems like Petpooja or POSist?",
    answer:
      "KIVO delivers the power of a modern cloud platform without hardware lock-in or clunky interfaces. You can run KIVO on any device — iPads, Android tablets, desktop browsers, or specialized POS hardware. You get lightning-fast 3-tap billing, modern Kitchen Display System (KDS) routing, and centralized real-time analytics without expensive proprietary hardware.",
  },
  {
    question: "Does KIVO support GST billing and thermal receipt printers in India?",
    answer:
      "Yes, KIVO is fully compliant with Indian GST requirements, supporting SGST, CGST, IGST, HSN codes, and tax-inclusive pricing. It connects directly with standard 2-inch (58mm) and 3-inch (80mm) ESC/POS thermal receipt printers via USB, Bluetooth, and network LAN (port 9100).",
  },
  {
    question: "Can I manage multi-outlet restaurant chains and central inventory?",
    answer:
      "Yes. KIVO's centralized cloud dashboard allows multi-outlet operators to manage menus, push standardized pricing, monitor live branch revenue, and transfer stock between central commissaries and retail outlets with role-based access controls.",
  },
  {
    question: "How do I get started with KIVO?",
    answer:
      "You can test drive the system directly through our interactive live demo without signing in, or create your restaurant account in under 60 seconds with our free cloud trial.",
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="size-3.5" />
          Frequently Asked Questions
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything You Need to Know About KIVO
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Clear answers on offline billing, hardware compatibility, GST compliance, and cloud architecture.
        </p>
      </Reveal>

      <RevealGroup className="mt-12 space-y-3.5">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <RevealItem key={faq.question}>
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all duration-200",
                  isOpen
                    ? "border-primary/40 bg-card shadow-sm"
                    : "border-border/60 bg-card/60 hover:border-border"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-sm sm:text-base font-semibold text-foreground"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-primary"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm leading-relaxed text-muted-foreground border-t border-border/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
