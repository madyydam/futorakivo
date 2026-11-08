"use client";

import { AppShell } from "@/components/layout/app-shell";
import { BranchProvider } from "@/hooks/use-branch";
import { DEMO_USER } from "@/hooks/use-auth";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider>
      <AppShell user={DEMO_USER}>{children}</AppShell>
    </BranchProvider>
  );
}
