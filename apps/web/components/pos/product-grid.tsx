"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveTabs } from "@/components/ui/nav-picker";
import { useCategories, useMenuItems, type MenuItem } from "@/hooks/use-menu";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductGrid({
  branchId,
  onSelect,
}: {
  branchId: string | null;
  onSelect: (item: MenuItem) => void;
}) {
  const { data: categories } = useCategories(branchId);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const { data: items, isLoading, isError, error, refetch, isFetching } = useMenuItems(branchId, activeCategoryId);

  const filtered = items?.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col gap-4">
      <Input
        placeholder="Search menu…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 rounded-2xl bg-white dark:bg-card border-slate-200/80 dark:border-border shadow-2xs text-sm"
      />

      {categories && categories.length > 0 && (
        <ResponsiveTabs
          mobileOnly
          className="lg:hidden"
          label="Category"
          value={activeCategoryId ?? "all"}
          onChange={(id) => setActiveCategoryId(id === "all" ? undefined : id)}
          desktopListClassName="justify-start lg:h-auto lg:flex-wrap"
          items={[{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.id, label: c.name, hint: `${c._count.items} items` }))]}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-4">
      {categories && categories.length > 0 && (
        <nav
          aria-label="Category"
          className="hidden w-40 shrink-0 flex-col gap-1 overflow-y-auto border-r border-slate-200/80 dark:border-border pr-2.5 lg:flex xl:w-44"
        >
          {[{ id: undefined as string | undefined, name: "All", count: undefined as number | undefined }, ...categories.map((c) => ({ id: c.id as string | undefined, name: c.name, count: c._count.items as number | undefined }))].map((c) => {
            const active = c.id === activeCategoryId;
            return (
              <button
                key={c.id ?? "all"}
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => setActiveCategoryId(c.id)}
                className={cn(
                  "flex min-h-9 items-center justify-between gap-1.5 rounded-xl px-3 py-2 text-left text-xs transition-all",
                  active
                    ? "bg-[#9f1239] font-bold text-white shadow-xs"
                    : "font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                <span className="min-w-0 truncate leading-tight" title={c.name}>
                  {c.name}
                </span>
                {c.count !== undefined && (
                  <span className={cn("shrink-0 text-[11px] tabular-nums px-1.5 py-0.5 rounded-md", active ? "bg-white/20 text-white font-bold" : "text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 font-medium")}>
                    {c.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {isError && !items ? (
        <QueryError error={error} what="the menu" onRetry={() => void refetch()} retrying={isFetching} />
      ) : (
      <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(145px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(155px,1fr))] gap-3 sm:gap-3.5 overflow-y-auto overflow-x-hidden pb-4 pr-1">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[20px]" />)}
        {filtered?.map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.name}
            onClick={() => onSelect(item)}
            className="group flex min-h-[120px] min-w-0 flex-col justify-between rounded-[20px] border border-slate-200/90 dark:border-border bg-white dark:bg-card p-3 sm:p-3.5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#9f1239]/40 active:scale-[0.98] active:translate-y-0"
          >
            {/* Top row: veg/non-veg dot with border frame + optional half badge */}
            <div className="flex w-full items-center justify-between">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                  item.isVeg
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-rose-600 bg-rose-50 dark:bg-rose-950/30"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    item.isVeg ? "bg-emerald-600" : "bg-rose-600"
                  )}
                />
              </span>
              {item.halfPrice != null && (
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Half
                </span>
              )}
            </div>

            {/* Middle: Item title, no character-by-character wrap */}
            <span className="my-1.5 line-clamp-2 w-full text-xs sm:text-sm font-bold leading-snug text-slate-900 dark:text-white transition-colors group-hover:text-[#9f1239] dark:group-hover:text-rose-400">
              {item.name}
            </span>

            {/* Bottom: Price + quick-add badge */}
            <div className="flex w-full items-center justify-between border-t border-slate-100 dark:border-border/60 pt-2">
              <div className="flex flex-col">
                <span className="font-mono text-sm font-extrabold tabular-nums text-[#9f1239] dark:text-rose-400">
                  {formatCurrency(item.price)}
                </span>
                {item.halfPrice != null && (
                  <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                    Half {formatCurrency(item.halfPrice)}
                  </span>
                )}
              </div>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-hover:bg-[#9f1239] group-hover:text-white">
                +
              </span>
            </div>
          </button>
        ))}
        {filtered?.length === 0 && !isLoading && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            {search ? <>No items match &quot;{search}&quot;</> : "No items in this category yet"}
          </p>
        )}
      </div>
      )}
      </div>
      </div>
    </div>
  );
}
