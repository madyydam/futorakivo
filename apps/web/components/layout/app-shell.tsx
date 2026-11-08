"use client";

import type { SessionUser } from "@modexsys/types";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { EntityDialogHost } from "@/components/layout/entity-dialog-host";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useBranch } from "@/hooks/use-branch";
import { useDisplaySettings } from "@/hooks/use-settings";
import { BrandFooter } from "./brand-footer";
import { BranchSwitcher } from "./branch-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

function sanitizeBrandName(name?: string | null): string {
  if (!name) return "Modexsys HORECA";
  const cleaned = name
    .replace(/nodedr\s*bistro(\s*\(demo\))?/gi, "Modexsys HORECA")
    .replace(/nodedr/gi, "Modexsys")
    .replace(/\s*\(demo\)/gi, "")
    .replace(/bistro/gi, "")
    .trim();
  return cleaned || "Modexsys HORECA";
}

// The restaurant's own logo + name lead the sidebar header — this is
// white-label SaaS platform, so the operator's branding takes the
// prime spot an operator actually looks at. The Modexsys HORECA product
// mark moves to a small credit line at the bottom (BrandFooter) instead of
// competing with it up here. Falls back to the product mark only until the
// restaurant sets its own logo/name under Settings.
function RestaurantBrand() {
  const { branchId } = useBranch();
  const { data } = useDisplaySettings(branchId);
  const restaurant = data?.restaurant;
  const brandName = sanitizeBrandName(restaurant?.name);

  if (restaurant?.logoUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- uploaded asset served from the backend, not a Next-optimizable remote source */}
        <img
          src={restaurant.logoUrl}
          alt={brandName}
          className="h-8 w-8 shrink-0 rounded-lg object-contain"
        />
        <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
          {brandName}
        </span>
      </>
    );
  }

  return (
    <>
      <Logo />
      <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
        {brandName}
      </span>
    </>
  );
}

export function AppShell({
  user,
  children,
}: {
  user?: SessionUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [todayString] = useState(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  });

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#FAF8F8] dark:bg-[#0C0D10]">
      {/* Ambient luxury maroon radial lighting meshes - strictly in background (z-0), behind the floating sidebar & top header */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        <div className="absolute -left-12 -top-12 h-[540px] w-[540px] rounded-full bg-gradient-to-br from-[#881337]/35 via-[#9f1239]/22 to-transparent blur-3xl" />
        <div className="absolute -left-20 top-1/3 h-[500px] w-[480px] rounded-full bg-gradient-to-r from-[#9f1239]/30 via-[#be123c]/20 to-transparent blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-[#881337]/30 via-[#9f1239]/20 to-transparent blur-3xl" />
        {/* Ambient maroon lighting glow across the top header in the background */}
        <div className="absolute right-10 -top-28 h-[420px] w-[580px] rounded-full bg-gradient-to-b from-[#881337]/24 via-[#9f1239]/14 to-transparent blur-3xl" />
      </div>

      {/* Desktop floating island sidebar - crisp solid white with round corners */}
      <aside className="relative hidden w-64 shrink-0 my-3 ml-3 rounded-[28px] border border-slate-200/80 dark:border-border bg-white dark:bg-card shadow-sm lg:flex flex-col h-[calc(100vh-24px)] select-none overflow-hidden z-20">
        <div className="flex h-16 shrink-0 items-center gap-2 px-5 border-b border-slate-100 dark:border-border/60">
          <RestaurantBrand />
        </div>
        <div className="shrink-0 px-3 py-3 border-b border-slate-100 dark:border-border/60">
          <BranchSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <SidebarNav user={user} />
        </div>
        <div className="shrink-0">
          <BrandFooter />
        </div>
      </aside>

      {/* Mobile drawer - solid white */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-white dark:bg-card border-r border-slate-200/80 dark:border-border p-0 flex flex-col h-full">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 shrink-0 items-center gap-2 px-5 border-b border-slate-100 dark:border-border/60">
            <RestaurantBrand />
          </div>
          <div className="shrink-0 px-3 py-3 border-b border-slate-100 dark:border-border/60">
            <BranchSwitcher />
          </div>
          <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="shrink-0">
            <BrandFooter />
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        {/* Floating island top header - crisp solid white with round corners, compact height & clear margin from sidebar */}
        <header className="mt-3 mr-3 ml-3 mb-2 flex h-12 shrink-0 items-center justify-between rounded-[22px] border border-slate-200/80 dark:border-border bg-white dark:bg-card px-3.5 sm:px-5 shadow-sm z-20">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/75 dark:border-border/60 bg-[#F7F4F3] dark:bg-slate-900/50 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-card lg:hidden transition-all"
              aria-label="Open navigation"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200/75 dark:border-border/60 bg-[#F7F4F3] dark:bg-slate-900/50 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] px-2.5 py-1">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
                Live · {todayString}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <LanguageSwitcher compact />
            <NotificationBell />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-3 py-2 pb-24 sm:pb-24 overscroll-contain">
          {children}
        </main>
        <EntityDialogHost />
      </div>
      <MobileBottomNav user={user} onMore={() => setMobileOpen(true)} />
    </div>
  );
}
