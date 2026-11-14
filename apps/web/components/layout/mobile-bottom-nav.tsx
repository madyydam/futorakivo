"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import type { SessionUser } from "@futora/types";
import { hasPermission } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { NAV_ITEMS } from "./nav-items";

const DEMO_ROUTE_MAP: Record<string, string> = {
  "/dashboard": "/demo",
  "/pos": "/demo/pos",
  "/orders": "/demo/orders",
  "/tables": "/demo/tables",
  "/kds": "/demo/kds",
  "/menu": "/demo/menu",
  "/reports": "/demo/reports",
};

// The screens staff jump between all shift long, in priority order.
const PRIMARY_HREFS = ["/pos", "/orders", "/tables", "/kds", "/dashboard"];
const PRIMARY_COUNT = 4;

// Thumb-reach navigation for phones & tablets. Hidden from lg up, where the floating sidebar takes over.
export function MobileBottomNav({
  user,
  onMore,
}: {
  user?: SessionUser;
  onMore: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const badges = useNavBadges();
  const isDemoMode = Boolean(pathname?.startsWith("/demo"));

  const allowed = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(user, item.permission),
  );
  const primary = PRIMARY_HREFS.map((href) => allowed.find((i) => i.href === href))
    .filter((i): i is (typeof allowed)[number] => !!i)
    .slice(0, PRIMARY_COUNT);

  const itemClass =
    "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors select-none";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/80 bg-white/95 dark:bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden"
    >
      {primary.map((item) => {
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
            aria-current={isActive ? "page" : undefined}
            className={cn(
              itemClass,
              "h-16 active:scale-95 transition-transform",
              isActive ? "text-[#9f1239] dark:text-rose-400 font-bold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
            <span className="max-w-full truncate px-1 text-[11px]">{t(item.labelKey)}</span>
            {badges.nav[item.href] && !isActive ? (
              <span className="absolute top-2 left-1/2 ml-2 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_2px_rgba(245,158,11,0.7)]" />
            ) : null}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMore}
        className={cn(itemClass, "h-16 text-muted-foreground active:scale-95 transition-transform hover:text-foreground")}
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="text-[11px]">More</span>
      </button>
    </nav>
  );
}
