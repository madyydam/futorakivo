import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const columns = [
  {
    title: "Solutions",
    links: [
      { href: "/solutions/qsr", label: "QSR & Fast Food" },
      { href: "/solutions/cloud-kitchen", label: "Cloud Kitchens" },
      { href: "/solutions/fine-dining", label: "Fine Dining & Bars" },
      { href: "/compare/petpooja", label: "KIVO vs Petpooja" },
    ],
  },
  {
    title: "Product & Demo",
    links: [
      { href: "/demo", label: "Interactive Demo" },
      { href: "/demo/pos", label: "Cloud POS Terminal" },
      { href: "/demo/kds", label: "Kitchen Display (KDS)" },
      { href: "/demo/tables", label: "Table Floor Plan" },
    ],
  },
  {
    title: "Documentation",
    links: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/api", label: "API & MCP" },
      { href: "/docs/compliance-india", label: "India GST Compliance" },
      { href: "/docs/accessibility", label: "Accessibility Statement" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="text-sm font-bold text-foreground">
                KIVO
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              All-in-one cloud restaurant management platform and POS. Fast billing, KDS, inventory, and analytics built for modern restaurants and cafés.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {col.title}
              </h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} KIVO - FUTORA GROUP OF COMPANIES</p>
        </div>
      </div>
    </footer>
  );
}
