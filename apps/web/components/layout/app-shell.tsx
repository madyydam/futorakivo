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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar with glassmorphism & independent scroll */}
      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-sidebar-border/60 bg-sidebar/70 backdrop-blur-2xl backdrop-saturate-150 shadow-lg shadow-black/[0.03] lg:flex h-full select-none">
        <div className="flex h-16 shrink-0 items-center gap-2 px-5 border-b border-sidebar-border/40">
          <RestaurantBrand />
        </div>
        <div className="shrink-0 px-3 py-3 border-b border-sidebar-border/30">
          <BranchSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <SidebarNav user={user} />
        </div>
        <div className="shrink-0 border-t border-sidebar-border/40">
          <BrandFooter />
        </div>
      </aside>

      {/* Mobile drawer with glassmorphism */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar/85 backdrop-blur-2xl border-r border-sidebar-border/60 p-0 flex flex-col h-full">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 shrink-0 items-center gap-2 px-5 border-b border-sidebar-border/40">
            <RestaurantBrand />
          </div>
          <div className="shrink-0 px-3 py-3 border-b border-sidebar-border/30">
            <BranchSwitcher />
          </div>
          <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="shrink-0 border-t border-sidebar-border/40">
            <BrandFooter />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6 z-20">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <LanguageSwitcher compact />
            <NotificationBell />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 overscroll-contain">{children}</main>
        <EntityDialogHost />
      </div>
      <MobileBottomNav user={user} onMore={() => setMobileOpen(true)} />
    </div>
  );
}
