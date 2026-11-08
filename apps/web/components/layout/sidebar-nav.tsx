"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@modexsys/types";
import { hasPermission } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { NavDot } from "./nav-dot";
import { NAV_ITEMS } from "./nav-items";

const DEMO_ROUTE_MAP: Record<string, string> = {
  "/dashboard": "/demo",
  "/pos": "/demo/pos",
  "/kds": "/demo/kds",
  "/tables": "/demo/tables",
  "/orders": "/demo/orders",
  "/menu": "/demo/menu",
  "/reports": "/demo/reports",
};

export function SidebarNav({
  user,
  onNavigate,
}: {
  user?: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const badges = useNavBadges();
  const isDemoMode = Boolean(pathname?.startsWith("/demo"));

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.filter((item) => !item.permission || hasPermission(user, item.permission)).map(
        (item) => {
          const href = isDemoMode && DEMO_ROUTE_MAP[item.href] ? DEMO_ROUTE_MAP[item.href] : item.href;
          const isActive = isDemoMode
            ? item.href === "/dashboard"
              ? pathname === "/demo"
              : pathname?.startsWith(DEMO_ROUTE_MAP[item.href] ?? item.href)
            : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {t(item.labelKey)}
              {badges.nav[item.href] && !isActive ? <NavDot /> : null}
            </Link>
          );
        },
      )}
    </nav>
  );
}
