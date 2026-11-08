"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableItem {
  name: string;
  status: "OCCUPIED" | "BILLED" | "AVAILABLE" | "RESERVED";
}

export const DEFAULT_12_TABLES: TableItem[] = [
  { name: "T-1", status: "OCCUPIED" },
  { name: "T-2", status: "BILLED" },
  { name: "T-3", status: "AVAILABLE" },
  { name: "T-4", status: "OCCUPIED" },
  { name: "T-5", status: "AVAILABLE" },
  { name: "T-6", status: "AVAILABLE" },
  { name: "T-7", status: "RESERVED" },
  { name: "T-8", status: "AVAILABLE" },
  { name: "T-9", status: "OCCUPIED" },
  { name: "T-10", status: "AVAILABLE" },
  { name: "T-11", status: "BILLED" },
  { name: "T-12", status: "AVAILABLE" },
];

export function LuxuryTableGrid({
  tables = DEFAULT_12_TABLES,
  href = "/tables",
  className,
}: {
  tables?: TableItem[];
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[26px] bg-white/90 dark:bg-card/90 p-6 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-[#9f1239]" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Live Tables Occupancy
          </h3>
        </div>
        <Link
          href={href}
          className="text-xs font-semibold text-[#9f1239] dark:text-rose-400 hover:underline flex items-center gap-1 transition-colors"
        >
          Floor Plan →
        </Link>
      </div>

      {/* 4x3 Grid */}
      <div className="grid grid-cols-4 gap-2.5 pt-2">
        {tables.slice(0, 12).map((table) => {
          const isOcc = table.status === "OCCUPIED";
          const isBil = table.status === "BILLED";
          const isRes = table.status === "RESERVED";
          const isAva = table.status === "AVAILABLE";

          const statusCode = isOcc
            ? "OCC"
            : isBil
            ? "BIL"
            : isRes
            ? "RES"
            : "AVA";

          return (
            <Link
              key={table.name}
              href={href}
              className={cn(
                "group flex flex-col items-center justify-center rounded-2xl py-3 px-1.5 text-center transition-all duration-200 hover:scale-105 border shadow-2xs",
                isOcc &&
                  "bg-[#ffedd5] dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/40 hover:bg-[#fed7aa]",
                isBil &&
                  "bg-[#ffe4e6] dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40 hover:bg-[#fecdd3]",
                isRes &&
                  "bg-[#fce7f3] dark:bg-pink-950/40 border-pink-200/70 dark:border-pink-900/40 hover:bg-[#fbcfe8]",
                isAva &&
                  "bg-[#f1f5f9] dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-200/70",
              )}
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {table.name}
              </span>
              <span
                className={cn(
                  "text-[10px] font-extrabold tracking-wider mt-0.5",
                  isOcc && "text-[#c2410c] dark:text-amber-400",
                  isBil && "text-[#be123c] dark:text-rose-400",
                  isRes && "text-[#db2777] dark:text-pink-400",
                  isAva && "text-[#64748b] dark:text-slate-400",
                )}
              >
                {statusCode}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

