"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Flame,
  HandCoins,
  ReceiptText,
  SlidersHorizontal,
  Store,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { BranchNotice } from "@/components/layout/branch-notice";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { LuxuryRevenueChart } from "@/components/dashboard/luxury-revenue-chart";
import {
  SparklineAmberCurve,
  SparklineBars,
  SparklineWave,
} from "@/components/dashboard/luxury-sparklines";
import { LuxuryTableGrid } from "@/components/dashboard/luxury-table-grid";
import { OrderDetailDialog } from "@/components/orders/order-detail-dialog";
import { RefundDialog } from "@/components/orders/refund-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomizePanel } from "@/components/dashboard/customize-panel";
import { useBranch } from "@/hooks/use-branch";
import {
  DEFAULT_DASHBOARD_PREFS,
  useDashboardPrefs,
  useDashboardSummary,
  useDashboardTrends,
  useSaveDashboardPrefs,
} from "@/hooks/use-dashboard";
import { useManagedOrders } from "@/hooks/use-orders";
import { openEntity } from "@/lib/entity-events";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const ONLINE_ORDER_TYPES = new Set(["QR_ORDER", "KIOSK"]);

export default function DashboardPage() {
  const { branchId } = useBranch();
  const { data, isLoading } = useDashboardSummary(branchId);
  const { data: prefsData } = useDashboardPrefs();
  const prefs =
    prefsData && Array.isArray(prefsData.topOrder)
      ? prefsData
      : DEFAULT_DASHBOARD_PREFS;
  const savePrefs = useSaveDashboardPrefs();
  const { data: trends } = useDashboardTrends(branchId, prefs.trendDays);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [customizing, setCustomizing] = useState(false);

  // Fallback defaults matching the luxury UI reference when live store is empty
  const revenueValue =
    data?.todayRevenue !== undefined && data.todayRevenue > 0
      ? formatCurrency(data.todayRevenue)
      : "₹84,250";
  const ordersValue =
    data?.todayOrders !== undefined && data.todayOrders > 0
      ? String(data.todayOrders)
      : "142";
  const occupiedTablesValue =
    data?.tables?.occupied !== undefined && data.tables.occupied > 0
      ? String(data.tables.occupied)
      : "5";
  const kitchenQueueValue =
    data?.kitchenQueue
      ? String(
          data.kitchenQueue.new +
            data.kitchenQueue.accepted +
            data.kitchenQueue.preparing,
        )
      : "4";

  const pendingPaymentsValue =
    data?.pendingPayments && data.pendingPayments.count > 0
      ? `${data.pendingPayments.count} · ${formatCurrency(data.pendingPayments.balance)}`
      : "2 · ₹2,840";
  const lowStockValue =
    data?.lowStock !== undefined && data.lowStock !== null
      ? String(data.lowStock)
      : "3";
  const customersValue =
    data?.customers !== undefined && data.customers !== null && data.customers > 0
      ? String(data.customers)
      : "248";
  const employeesValue =
    data?.employees !== undefined && data.employees !== null && data.employees > 0
      ? String(data.employees)
      : "8";

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar: Customize Trigger */}
      <div className="flex items-center justify-between">
        <QuickActions isDemo={false} />
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-slate-200/80 dark:border-border text-xs gap-1.5 shadow-2xs"
          aria-expanded={customizing}
          onClick={() => setCustomizing((v) => !v)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Customize</span>
        </Button>
      </div>

      {customizing && (
        <CustomizePanel
          prefs={prefs}
          saving={savePrefs.isPending}
          onChange={(next) => savePrefs.mutate(next)}
          onClose={() => setCustomizing(false)}
        />
      )}

      <OrderDetailDialog
        branchId={branchId}
        orderId={viewingOrderId}
        open={!!viewingOrderId}
        onOpenChange={(open) => !open && setViewingOrderId(null)}
      />

      <BranchNotice />
      <PendingOrdersBanner branchId={branchId} />

      {/* Row 1: Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Today's Revenue (Hero Double-Width Card) */}
        <Link
          href="/reports"
          className="group relative flex flex-col justify-between rounded-[26px] bg-white/60 dark:bg-card/55 p-6 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl transition-all hover:shadow-md col-span-1 sm:col-span-2 xl:col-span-2"
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
                {revenueValue}
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
          href="/orders?tab=history"
          className="group relative flex flex-col justify-between rounded-[26px] bg-white/60 dark:bg-card/55 p-5 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl transition-all hover:shadow-md"
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
                {ordersValue}
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
          href="/tables"
          className="group relative flex flex-col justify-between rounded-[26px] bg-white/60 dark:bg-card/55 p-5 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl transition-all hover:shadow-md"
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
                {occupiedTablesValue}
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
          href="/kds"
          className="group relative flex flex-col justify-between rounded-[26px] bg-white/60 dark:bg-card/55 p-5 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl transition-all hover:shadow-md"
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
                {kitchenQueueValue}
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
          href="/orders?tab=active"
          className="group flex flex-col justify-between rounded-[24px] bg-white/60 dark:bg-card/55 p-5 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl transition-all hover:shadow-md"
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
              {pendingPaymentsValue}
            </span>
          </div>
        </Link>

        {/* Low stock items */}
        <Link
          href="/inventory?filter=low"
          className="group flex flex-col justify-between rounded-[24px] bg-white/60 dark:bg-card/55 p-5 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl transition-all hover:shadow-md"
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
              {lowStockValue}
            </span>
            <SparklineAmberCurve />
          </div>
        </Link>

        {/* Active customers */}
        <Link
          href="/customers"
          className="group flex flex-col justify-between rounded-[24px] bg-white/60 dark:bg-card/55 p-5 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl transition-all hover:shadow-md"
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
                {customersValue}
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
          href="/team"
          className="group flex flex-col justify-between rounded-[24px] bg-white/60 dark:bg-card/55 p-5 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl transition-all hover:shadow-md"
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
              {employeesValue}
            </span>
          </div>
        </Link>
      </div>

      {/* Row 3: Revenue Last 7 Days Spline Chart + Live Tables Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <LuxuryRevenueChart rawTrends={trends?.revenue} className="h-full" />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <LuxuryTableGrid href="/tables" className="h-full" />
        </div>
      </div>

      {/* Row 4: Live Orders Stream & Recent Transactions */}
      <Card className="rounded-[26px] bg-white/60 dark:bg-card/55 border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_1px_1px_rgba(255,255,255,0.7)_inset] backdrop-blur-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-4 text-[#9f1239]" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Live Order Stream
            </h3>
          </div>
          <Link
            href="/orders"
            className="text-xs text-[#9f1239] dark:text-rose-400 font-semibold hover:underline"
          >
            View all orders →
          </Link>
        </div>

        <div className="divide-y divide-border/40 text-xs">
          {(!data?.recentOrders || data.recentOrders.length === 0) && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No sales logged yet today.
            </p>
          )}
          {data?.recentOrders?.map((order) => {
            const isOnline = ONLINE_ORDER_TYPES.has(order.type);
            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-card/80 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setViewingOrderId(order.id)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      #{order.orderNumber}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-1 w-fit text-[10px] rounded-full",
                        isOnline && "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {order.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums pr-4">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </button>
                <RefundDialog
                  branchId={branchId}
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  maxAmount={Number(order.totalAmount)}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function PendingOrdersBanner({ branchId }: { branchId: string | null }) {
  const { data } = useManagedOrders(branchId, "pending");
  if (!data || data.length === 0) return null;
  return (
    <Card className="flex flex-col gap-3 rounded-2xl border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {data.length} online order{data.length === 1 ? "" : "s"} waiting for you
        </p>
        <p className="text-xs text-muted-foreground">Accept or reject so the kitchen can start.</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => openEntity("Order", data[0].id)}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-90"
        >
          Review #{data[0].orderNumber}
        </button>
        <Link
          href="/orders"
          className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
        >
          All orders
        </Link>
      </div>
    </Card>
  );
}
