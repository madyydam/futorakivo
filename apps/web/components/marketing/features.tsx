import {
  ChefHat,
  Cloud,
  Gift,
  Package,
  Plug,
  QrCode,
  ShieldCheck,
  UtensilsCrossed,
  WifiOff,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const features = [
  {
    icon: UtensilsCrossed,
    title: "Dine-in POS & billing",
    description:
      "Modifiers, combos, split & merge bills, tips, gift cards, multi-payment checkout, and tax-inclusive GST pricing done right.",
  },
  {
    icon: ChefHat,
    title: "Live Kitchen Display (KDS)",
    description:
      "KOTs auto-routed to the right kitchen station, reprint & priority controls, and per-station prep-time reporting in real-time.",
  },
  {
    icon: QrCode,
    title: "Tables & reservations",
    description:
      "Visual floor plan, booking with waitlist, table transfer, and per-table QR codes for a read-only public menu.",
  },
  {
    icon: Package,
    title: "Inventory & procurement",
    description:
      "Ingredients, weighted-average recipe costing, purchase orders, goods receipt with batch/lot tracking, and FIFO waste logging.",
  },
  {
    icon: Gift,
    title: "CRM, loyalty & gift cards",
    description:
      "Customer profiles, earn-and-redeem loyalty points, gift card issuance, and complete visit and order history.",
  },
  {
    icon: WifiOff,
    title: "Offline-ready resilience",
    description:
      "Never miss a sale when internet cuts out. POS billing, KDS tickets, and kitchen printing work seamlessly offline, then auto-sync to the cloud the moment you reconnect.",
  },
  {
    icon: ShieldCheck,
    title: "RBAC on every action",
    description:
      "Granular, individually toggleable permissions and strict multi-tenant isolation — never a hardcoded role check.",
  },
  {
    icon: Cloud,
    title: "Centralized cloud SaaS",
    description:
      "Manage all your menus, pricing, customer CRM, multi-branch operations, staff permissions, and financial reports from a single centralized cloud platform accessible from anywhere.",
  },
  {
    icon: Plug,
    title: "API & integrations",
    description:
      "Connect third-party kiosks, order aggregator webhooks, or external delivery channels via secured, scoped API keys.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything a real HORECA operation needs
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Not a retail POS bolted onto a restaurant — purpose-built for
          fine dining, cafés, quick service, bars, and cloud kitchens.
        </p>
      </Reveal>

      <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <RevealItem
            key={f.title}
            className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg"
          >
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.description}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}