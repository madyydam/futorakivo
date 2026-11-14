import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, DocSection } from "@/components/marketing/doc-page";

export const metadata: Metadata = {
  title: "Documentation — KIVO - HORECA management simplified",
  description: "API & MCP, accessibility, and India compliance docs for the KIVO - HORECA management simplified cloud platform.",
};

const docs = [
  {
    href: "/docs/api",
    title: "API & MCP integrations",
    description: "Connect an AI client via MCP, or use KIVO - HORECA management simplified as a backend for your own website.",
  },
  {
    href: "/docs/accessibility",
    title: "Accessibility statement",
    description: "How KIVO - HORECA management simplified is built to work with keyboards, screen readers, and reduced motion.",
  },
  {
    href: "/docs/compliance-india",
    title: "India compliance notes",
    description: "GST, receipts, and data-residency notes for running KIVO - HORECA management simplified in India.",
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
          and multi-branch cloud federation, contact FUTORA group Enterprise Support at{" "}
          <strong className="text-foreground">support@futora.com</strong>.
        </p>
      </DocSection>
    </DocPage>
  );
}
