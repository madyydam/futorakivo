"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarPlus,
  ChefHat,
  ClipboardList,
  Flame,
  HandCoins,
  LayoutGrid,
  ReceiptText,
  ShoppingCart,
  Store,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  href,
  size = "default",
  className,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  accent?: "success" | "warning";
  href: string;
  size?: "hero" | "default" | "compact";
  className?: string;
}) {
  const hero = size === "hero";
  const compact = size === "compact";
  return (
    <Link
      href={href}
      aria-label={`${label}: ${value}. Open details`}
      className={cn(
        "group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
    >
      <Card
        className={cn(
          "flex h-full flex-col transition group-hover:border-primary/40 group-hover:shadow-md",
          hero
            ? "justify-between gap-6 border-success/25 bg-gradient-to-br from-success/10 via-card to-card p-6 sm:p-7"
            : compact
            ? "gap-2 p-4"
            : "gap-3 p-4 sm:p-6",
          accent === "warning" && !hero && "border-warning/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className={cn("font-medium text-muted-foreground", compact ? "text-xs" : "text-[13px]")}>
            {label}
          </span>
          <div
            className={cn(
              "flex items-center justify-center rounded-xl",
              compact ? "h-7 w-7" : "h-9 w-9",
              accent === "success" && "bg-success/10 text-success",
              accent === "warning" && "bg-warning/10 text-warning",
              !accent && "bg-primary/10 text-primary",
            )}
          >
            <Icon className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
          </div>
        </div>
        <span
          className={cn(
            "font-semibold tabular-nums tracking-tight text-foreground",
            hero ? "text-4xl sm:text-5xl" : compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
          )}
        >
          {value}
        </span>
      </Card>
    </Link>
  );
}

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
  { id: "1", orderNumber: "ORD-1045", table: "Table 4", items: "2x Butter Naan, 1x Paneer Butter Masala, 1x Jeera Rice", total: 640, time: "2 mins ago", status: "PREPARING", type: "DINE_IN" },
  { id: "2", orderNumber: "ORD-1044", table: "Table 12", items: "1x Veg Biryani, 2x Cold Coffee", total: 500, time: "8 mins ago", status: "READY", type: "DINE_IN" },
  { id: "3", orderNumber: "ORD-1043", table: "Takeaway #3", items: "2x Dal Makhani, 4x Tandoori Roti", total: 560, time: "14 mins ago", status: "SERVED", type: "TAKEAWAY" },
  { id: "4", orderNumber: "ORD-1042", table: "Table 2", items: "1x Kadhai Paneer, 2x Garlic Naan, 1x Sweet Lassi", total: 580, time: "22 mins ago", status: "PAID", type: "QR_ORDER" },
  { id: "5", orderNumber: "ORD-1041", table: "Table 7", items: "1x Margherita Pizza, 1x Mocktail Blue Lagoon", total: 490, time: "35 mins ago", status: "PAID", type: "DINE_IN" },
];

const DEMO_REVENUE_TRENDS = [
  { date: "2026-11-02", amount: 62400 },
  { date: "2026-11-03", amount: 68500 },
  { date: "2026-11-04", amount: 74200 },
  { date: "2026-11-05", amount: 71000 },
  { date: "2026-11-06", amount: 89600 },
  { date: "2026-11-07", amount: 104200 },
  { date: "2026-11-08", amount: 84250 },
];

const DEMO_WASTE_TRENDS = [
  { date: "2026-11-02", cost: 1200 },
  { date: "2026-11-03", cost: 850 },
  { date: "2026-11-04", cost: 1600 },
  { date: "2026-11-05", cost: 950 },
  { date: "2026-11-06", cost: 1400 },
  { date: "2026-11-07", cost: 2100 },
  { date: "2026-11-08", cost: 1100 },
];

export default function DemoDashboardPage() {
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);
  const [now] = useState(() => new Date());
  const today = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Live Status exact same to same */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live · {today}
          </p>
        </div>
      </div>

      {/* Quick Actions exact same */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" render={<Link href="/demo/pos" />}>
          <ShoppingCart className="h-4 w-4" />
          New order
        </Button>
        <Button variant="outline" size="sm" render={<Link href="/demo/tables" />}>
          <LayoutGrid className="h-4 w-4" />
          Tables
        </Button>
        <Button variant="outline" size="sm" render={<Link href="/demo/kds" />}>
          <ChefHat className="h-4 w-4" />
          Kitchen display
        </Button>
        <Button variant="outline" size="sm" render={<Link href="/demo/menu" />}>
          <UtensilsCrossed className="h-4 w-4" />
          Menu
        </Button>
      </div>

      {/* Top 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5 [&>a:last-child:nth-child(odd)]:col-span-2 xl:[&>a:last-child:nth-child(odd)]:col-span-1">
        <StatCard
          label="Today's Revenue"
          value="₹84,250"
          icon={Wallet}
          accent="success"
          href="/demo/reports"
          size="hero"
          className="col-span-2 xl:col-span-2"
        />
        <StatCard
          label="Today's Orders"
          value="142"
          icon={ReceiptText}
          href="/demo/orders"
        />
        <StatCard
          label="Occupied Tables"
          value="5"
          icon={ClipboardList}
          href="/demo/tables"
        />
        <StatCard
          label="Kitchen Queue"
          value="4"
          icon={Flame}
          accent="warning"
          href="/demo/kds"
          className="col-span-2 xl:col-span-1"
        />
      </div>

      {/* Attention Strip */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5 [&>a:last-child:nth-child(odd)]:col-span-2 xl:[&>a:last-child:nth-child(odd)]:col-span-1">
        <StatCard
          size="compact"
          label="Pending payments"
          value="2 · ₹2,840"
          icon={HandCoins}
          accent="warning"
          href="/demo/orders"
        />
        <StatCard
          size="compact"
          label="Low stock items"
          value="3"
          icon={AlertTriangle}
          accent="warning"
          href="/demo/menu"
        />
        <StatCard
          size="compact"
          label="Active customers"
          value="248"
          icon={Users}
          href="/demo/orders"
        />
        <StatCard
          size="compact"
          label="Team on duty"
          value="8"
          icon={UserRound}
          href="/demo"
        />
      </div>

      {/* Trend Charts Section - exact same to same as main dashboard */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <TrendChart
          title="Revenue — last 7 days"
          icon={TrendingUp}
          data={DEMO_REVENUE_TRENDS}
          valueKey="amount"
          color="var(--success)"
          valueFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
          isLoading={false}
          emptyMessage="No revenue data recorded yet."
        />
        <TrendChart
          title="Food waste cost — last 7 days"
          icon={Trash2}
          data={DEMO_WASTE_TRENDS}
          valueKey="cost"
          color="var(--warning)"
          valueFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
          isLoading={false}
          emptyMessage="No waste logs recorded."
        />
      </div>

      {/* Two Column Layout: Orders & Live Operations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Orders Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <ReceiptText className="size-4 text-primary" />
                <h3 className="font-semibold text-sm">Live Order Stream</h3>
              </div>
              <Link href="/demo/orders" className="text-xs text-primary font-medium hover:underline">
                View all orders →
              </Link>
            </div>

            <div className="divide-y divide-border/40 text-xs">
              {INITIAL_ORDERS.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground font-mono">{order.orderNumber}</span>
                      <span className="text-[11px] text-muted-foreground">{order.time}</span>
                    </div>
                    <div className="hidden sm:block">
                      <span className="font-medium text-foreground">{order.table}</span>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[240px]">{order.items}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-foreground">₹{order.total}</span>
                    <Badge
                      variant={order.status === "PAID" ? "outline" : "secondary"}
                      className={cn(
                        "text-[10px] font-medium",
                        order.status === "PAID" && "bg-emerald-600 text-white hover:bg-emerald-700",
                        order.status === "PREPARING" && "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                        order.status === "READY" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Live Table Status & Top Dishes */}
        <div className="space-y-6">
          {/* Floor Status Card */}
          <Card className="border-border/60 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-primary" />
                <h3 className="font-semibold text-sm">Live Tables Occupancy</h3>
              </div>
              <Link href="/demo/tables" className="text-xs text-primary font-medium hover:underline">
                Floor Plan →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
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
              ].map((table) => (
                <Link
                  key={table.name}
                  href="/demo/tables"
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg p-2 text-center text-xs border transition-transform hover:scale-105",
                    table.status === "OCCUPIED" && "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold",
                    table.status === "BILLED" && "bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold",
                    table.status === "RESERVED" && "bg-purple-500/10 border-purple-500/40 text-purple-700 dark:text-purple-300",
                    table.status === "AVAILABLE" && "bg-muted/40 border-border text-muted-foreground",
                  )}
                >
                  <span className="font-mono text-xs">{table.name}</span>
                  <span className="text-[9px] uppercase tracking-wider">{table.status.slice(0, 3)}</span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Top Selling Items */}
          <Card className="border-border/60 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <ChefHat className="size-4 text-primary" />
                <h3 className="font-semibold text-sm">Top Velocity Dishes</h3>
              </div>
              <Link href="/demo/menu" className="text-xs text-primary font-medium hover:underline">
                Menu →
              </Link>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {[
                { name: "Dal Makhani (Slow-Cooked)", qty: 48, revenue: "₹15,360" },
                { name: "Butter Chicken", qty: 34, revenue: "₹14,280" },
                { name: "Butter Naan", qty: 142, revenue: "₹9,230" },
                { name: "Paneer Tikka (Tandoori)", qty: 29, revenue: "₹8,410" },
                { name: "Sweet Lassi (Kulhad)", qty: 45, revenue: "₹4,950" },
              ].map((dish, i) => (
                <div key={dish.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-muted font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground">{dish.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-foreground">{dish.revenue}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Order Inspect Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ReceiptText className="size-5 text-primary" />
                {selectedOrder.orderNumber} · {selectedOrder.table}
              </DialogTitle>
              <DialogDescription>
                Placed {selectedOrder.time} · Status: {selectedOrder.status}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="font-semibold text-muted-foreground mb-1">Items in this ticket:</p>
                <p className="text-foreground leading-relaxed">{selectedOrder.items}</p>
              </div>

              <div className="flex justify-between items-center border-t border-border/60 pt-2 text-sm font-bold">
                <span>Total Amount:</span>
                <span className="text-primary font-mono">₹{selectedOrder.total}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Link href="/demo/pos" className="flex-1">
                  <Button variant="outline" className="w-full text-xs">
                    Open POS
                  </Button>
                </Link>
                <Link href="/demo/orders" className="flex-1">
                  <Button className="w-full text-xs font-semibold">
                    View Full Invoice
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
