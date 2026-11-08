"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  Flame,
  HandCoins,
  ReceiptText,
  Store,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { LuxuryRevenueChart } from "@/components/dashboard/luxury-revenue-chart";
import {
  SparklineAmberCurve,
  SparklineBars,
  SparklineWave,
} from "@/components/dashboard/luxury-sparklines";
import { LuxuryTableGrid } from "@/components/dashboard/luxury-table-grid";
import { cn } from "@/lib/utils";

interface DemoOrder {
  id: string;
  orderNumber: string;
  table: string;
  items: string;
  total: number;
  time: string;
  status: "PAID" | "PREPARING" | "READY" | "SERVED";
  type: "DINE_IN" | "TAKEAWAY" | "QR_ORDER";
}

const INITIAL_ORDERS: DemoOrder[] = [
  {
    id: "1",
    orderNumber: "ORD-1045",
    table: "Table 4",
    items: "2x Butter Naan, 1x Paneer Butter Masala, 1x Jeera Rice",
    total: 640,
    time: "2 mins ago",
    status: "PREPARING",
    type: "DINE_IN",
  },
  {
    id: "2",
    orderNumber: "ORD-1044",
    table: "Table 12",
    items: "1x Veg Biryani, 2x Cold Coffee",
    total: 500,
    time: "8 mins ago",
    status: "READY",
    type: "DINE_IN",
  },
  {
    id: "3",
    orderNumber: "ORD-1043",
    table: "Takeaway #3",
    items: "2x Dal Makhani, 4x Tandoori Roti",
    total: 560,
    time: "14 mins ago",
    status: "SERVED",
    type: "TAKEAWAY",
  },
  {
    id: "4",
    orderNumber: "ORD-1042",
    table: "Table 2",
    items: "1x Kadhai Paneer, 2x Garlic Naan, 1x Sweet Lassi",
    total: 580,
    time: "22 mins ago",
    status: "PAID",
    type: "QR_ORDER",
  },
  {
    id: "5",
    orderNumber: "ORD-1041",
    table: "Table 7",
    items: "1x Margherita Pizza, 1x Mocktail Blue Lagoon",
    total: 490,
    time: "35 mins ago",
    status: "PAID",
    type: "DINE_IN",
  },
];

export default function DemoDashboardPage() {
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Action Pills matching reference UI */}
      <div>
        <QuickActions isDemo={true} />
      </div>

      {/* Row 1: Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Today's Revenue (Hero Double-Width Card) */}
        <Link
          href="/demo/reports"
          className="group relative flex flex-col justify-between rounded-[26px] bg-white/90 dark:bg-card/90 p-6 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-md col-span-1 sm:col-span-2 xl:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#9f1239]" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Today&apos;s Revenue
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#9f1239] border border-rose-100 dark:border-rose-900/30">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                ₹84,250
              </span>
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>↑ +12.5%</span>
              </div>
            </div>
            <SparklineWave />
          </div>
        </Link>

        {/* Today's Orders */}
        <Link
          href="/demo/orders"
          className="group relative flex flex-col justify-between rounded-[26px] bg-white/90 dark:bg-card/90 p-5 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Today&apos;s Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#9f1239] border border-rose-100 dark:border-rose-900/30">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                142
              </span>
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>↑ +8.1%</span>
              </div>
            </div>
            <SparklineBars />
          </div>
        </Link>

        {/* Occupied Tables */}
        <Link
          href="/demo/tables"
          className="group relative flex flex-col justify-between rounded-[26px] bg-white/90 dark:bg-card/90 p-5 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Occupied Tables
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#9f1239] border border-rose-100 dark:border-rose-900/30">
              <Store className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                5
              </span>
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>↑ +0.0%</span>
              </div>
            </div>
            <SparklineBars heights={[25, 40, 55, 70, 85]} />
          </div>
        </Link>

        {/* Kitchen Queue */}
        <Link
          href="/demo/kds"
          className="group relative flex flex-col justify-between rounded-[26px] bg-white/90 dark:bg-card/90 p-5 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Kitchen Queue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-100 dark:border-amber-900/30">
              <Flame className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                4
              </span>
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>↑ +1.0%</span>
              </div>
            </div>
            <SparklineBars heights={[20, 35, 60, 50, 75]} />
          </div>
        </Link>
      </div>

      {/* Row 2: Secondary Compact KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Pending payments */}
        <Link
          href="/demo/orders"
          className="group flex flex-col justify-between rounded-[24px] bg-white/90 dark:bg-card/90 p-5 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Pending payments
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-100 dark:border-amber-900/30">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              2 · ₹2,840
            </span>
          </div>
        </Link>

        {/* Low stock items */}
        <Link
          href="/demo/menu"
          className="group flex flex-col justify-between rounded-[24px] bg-white/90 dark:bg-card/90 p-5 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Low stock items
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-100 dark:border-amber-900/30">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              3
            </span>
            <SparklineAmberCurve />
          </div>
        </Link>

        {/* Active customers */}
        <Link
          href="/demo/orders"
          className="group flex flex-col justify-between rounded-[24px] bg-white/90 dark:bg-card/90 p-5 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Active customers
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#9f1239] border border-rose-100 dark:border-rose-900/30">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                248
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ↑ +6%
              </span>
            </div>
            <SparklineBars heights={[30, 45, 60, 80, 100]} className="h-6 w-9" />
          </div>
        </Link>

        {/* Team on duty */}
        <Link
          href="/demo"
          className="group flex flex-col justify-between rounded-[24px] bg-white/90 dark:bg-card/90 p-5 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Team on duty
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#9f1239] border border-rose-100 dark:border-rose-900/30">
              <UserRound className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              8
            </span>
          </div>
        </Link>
      </div>

      {/* Row 3: Revenue Last 7 Days Spline Chart + Live Tables Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <LuxuryRevenueChart className="h-full" />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <LuxuryTableGrid href="/demo/tables" className="h-full" />
        </div>
      </div>

      {/* Row 4: Live Orders Stream */}
      <Card className="rounded-[26px] bg-white/90 dark:bg-card/90 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-4 text-[#9f1239]" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Live Order Stream
            </h3>
          </div>
          <Link
            href="/demo/orders"
            className="text-xs text-[#9f1239] dark:text-rose-400 font-semibold hover:underline"
          >
            View all orders →
          </Link>
        </div>

        <div className="divide-y divide-border/40 text-xs">
          {INITIAL_ORDERS.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-card/80 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {order.orderNumber}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{order.time}</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {order.table}
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                    {order.items}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  ₹{order.total}
                </span>
                <Badge
                  variant={order.status === "PAID" ? "outline" : "secondary"}
                  className={cn(
                    "text-[10px] font-semibold rounded-full px-2.5 py-0.5",
                    order.status === "PAID" &&
                      "bg-emerald-600 text-white hover:bg-emerald-700",
                    order.status === "PREPARING" &&
                      "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                    order.status === "READY" &&
                      "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    order.status === "SERVED" &&
                      "bg-blue-500/15 text-blue-600 dark:text-blue-400",
                  )}
                >
                  {order.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedOrder?.orderNumber}</span>
              <Badge
                className={cn(
                  "text-[10px] rounded-full",
                  selectedOrder?.status === "PAID" && "bg-emerald-600 text-white",
                  selectedOrder?.status === "PREPARING" &&
                    "bg-rose-500/15 text-rose-600",
                  selectedOrder?.status === "READY" &&
                    "bg-amber-500/15 text-amber-600",
                )}
              >
                {selectedOrder?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.table} · {selectedOrder?.time}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Items Ordered
              </span>
              <p className="text-foreground leading-relaxed">{selectedOrder?.items}</p>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <span className="font-semibold text-muted-foreground">Order Total</span>
              <span className="font-mono text-xl font-bold text-foreground">
                ₹{selectedOrder?.total}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
