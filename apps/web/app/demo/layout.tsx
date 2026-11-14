import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { BranchProvider } from "@/hooks/use-branch";
import { DEMO_USER } from "@/hooks/use-auth";

export const metadata: Metadata = {
  title: "Interactive Live Demo — Cloud Restaurant POS & Management",
  description:
    "Test drive KIVO's live restaurant POS, kitchen display system (KDS), table management, and real-time billing terminal online with preloaded demo data.",
  alternates: {
    canonical: "/demo",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider>
      <AppShell user={DEMO_USER}>{children}</AppShell>
    </BranchProvider>
  );
}
