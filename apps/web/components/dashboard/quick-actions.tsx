"use client";

import Link from "next/link";
import { ChefHat, LayoutGrid, ShoppingCart, UtensilsCrossed } from "lucide-react";

export function QuickActions({ isDemo = false }: { isDemo?: boolean }) {
  const prefix = isDemo ? "/demo" : "";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* New Order: Gradient wine-red pill */}
      <Link
        href={`${prefix}/pos`}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9f1239] to-[#881337] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-all duration-150"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        <span>New order</span>
      </Link>

      {/* Tables: White rounded pill */}
      <Link
        href={`${prefix}/tables`}
        className="flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-border/80 bg-white/90 dark:bg-card/90 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-card transition-colors"
      >
        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Tables</span>
      </Link>

      {/* Kitchen Display: White rounded pill */}
      <Link
        href={`${prefix}/kds`}
        className="flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-border/80 bg-white/90 dark:bg-card/90 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-card transition-colors"
      >
        <ChefHat className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Kitchen display</span>
      </Link>

      {/* Menu: White rounded pill */}
      <Link
        href={`${prefix}/menu`}
        className="flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-border/80 bg-white/90 dark:bg-card/90 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-card transition-colors"
      >
        <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Menu</span>
      </Link>
    </div>
  );
}
