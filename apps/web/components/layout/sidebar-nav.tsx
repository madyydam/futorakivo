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
    <nav className="flex flex-col gap-1.5 px-3 py-1">
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
                "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-150 select-none",
                isActive
                  ? "bg-gradient-to-r from-[#9f1239] via-[#8e1032] to-[#780c29] text-white shadow-[0_4px_16px_rgba(159,18,57,0.32),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/20 font-bold backdrop-blur-md"
                  : "bg-[#F7F4F3] dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200/75 dark:border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white dark:hover:bg-card hover:border-slate-300 dark:hover:border-border hover:text-slate-900 dark:hover:text-white hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-[#9f1239] dark:group-hover:text-rose-400",
                )}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span className="truncate">{t(item.labelKey)}</span>
              {isOrders ? (
                <span
                  className={cn(
                    "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-2xs transition-colors",
                    isActive
                      ? "bg-white text-[#9f1239] shadow-sm font-extrabold"
                      : "bg-[#9f1239] text-white",
                  )}
                >
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
