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
          const isOrders = item.href === "/orders";
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150",
                isActive
                  ? "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:rounded-r-full before:bg-[#9f1239] bg-rose-50/90 dark:bg-[#9f1239]/20 text-[#9f1239] dark:text-rose-300 font-semibold shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-card/70 hover:text-slate-900 dark:hover:text-slate-100",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive ? "text-[#9f1239] dark:text-rose-400" : "text-slate-500 dark:text-slate-400",
                )}
                strokeWidth={isActive ? 2.2 : 1.9}
              />
              <span className="truncate">{t(item.labelKey)}</span>
              {isOrders ? (
                <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9f1239] text-[10px] font-bold text-white shadow-2xs">
                  3
                </span>
              ) : badges.nav[item.href] && !isActive ? (
                <NavDot />
              ) : null}
            </Link>
          );
        },
      )}
    </nav>
  );
}
