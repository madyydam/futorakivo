"use client";

import { motion } from "motion/react";

const tickets = [
  { table: "Table 4", items: ["2x Margherita", "1x Iced Latte"], status: "Preparing" },
  { table: "Table 9", items: ["1x Butter Chicken", "2x Naan"], status: "Ready" },
  { table: "Takeaway #182", items: ["1x Cold Brew"], status: "New" },
];

const statusColor: Record<string, string> = {
  New: "bg-warning/15 text-warning",
  Preparing: "bg-primary/15 text-primary",
  Ready: "bg-success/15 text-success",
};

export function PosMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="relative mx-auto w-full max-w-xl"
    >
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_16px_50px_-15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-3.5 py-2">
          <span className="size-2 rounded-full bg-destructive/50" />
          <span className="size-2 rounded-full bg-warning/50" />
          <span className="size-2 rounded-full bg-success/50" />
          <span className="ml-2.5 text-[11px] font-medium text-muted-foreground">Kitchen Display (KDS)</span>
        </div>
        <div className="grid gap-2.5 p-3 sm:grid-cols-3">
          {tickets.map((t, i) => (
            <motion.div
              key={t.table}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{t.table}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor[t.status]}`}>
                  {t.status}
                </span>
              </div>
              <ul className="flex flex-col gap-0.5">
                {t.items.map((it) => (
                  <li key={it} className="text-[11px] text-muted-foreground">
                    {it}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating KPI card */}
      <motion.div
        initial={{ opacity: 0, x: 12, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.35, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-3 -bottom-4 hidden w-36 rounded-xl border border-border/60 bg-card p-2.5 shadow-md sm:block"
      >
        <p className="text-[10px] font-medium text-muted-foreground">Table occupancy</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">72%</p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: "72%" }}
            transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
