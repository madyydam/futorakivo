import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, DocSection } from "@/components/marketing/doc-page";

export const metadata: Metadata = {
  title: "Documentation — Modexsys HORECA",
  description: "API & MCP, accessibility, and India compliance docs for a self-hosted Modexsys HORECA instance.",
};

const docs = [
  {
    href: "/docs/api",
    title: "API & MCP integrations",
    description: "Connect an AI client via MCP, or use Modexsys HORECA as a backend for your own website.",
  },
  {
    href: "/docs/accessibility",
    title: "Accessibility statement",
    description: "How Modexsys HORECA is built to work with keyboards, screen readers, and reduced motion.",
  },
  {
    href: "/docs/compliance-india",
    title: "India compliance notes",
    description: "GST, receipts, and data-residency notes for running Modexsys HORECA in India.",
  },
];

export default function DocsIndexPage() {
  return (
    <DocPage title="Documentation" updated="30 September 2026">
      <DocSection heading="Guides">
        <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60">
          {docs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="flex flex-col gap-1 p-4 transition-colors hover:bg-secondary"
            >
              <span className="text-sm font-medium text-foreground">{doc.title}</span>
              <span className="text-sm text-muted-foreground">{doc.description}</span>
            </Link>
          ))}
        </div>
      </DocSection>

      <DocSection heading="Support & Custom Integrations">
        <p>
          For setup assistance, specialized hardware drivers (thermal printers, barcode scanners, cash drawers),
          and multi-branch cloud federation, contact Modexsys Enterprise Support at{" "}
          <strong className="text-foreground">support@modexsys.com</strong>.
        </p>
      </DocSection>
    </DocPage>
  );
}
