"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ChefHat,
  ClipboardList,
  Flame,
  HandCoins,
  ReceiptText,
  Sparkles,
  Store,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  { id: "1", orderNumber: "ORD-1045", table: "Table 4", items: "2x Butter Naan, 1x Paneer Butter Masala, 1x Jeera Rice", total: 640, time: "2 mins ago", status: "PREPARING", type: "DINE_IN" },
  { id: "2", orderNumber: "ORD-1044", table: "Table 12", items: "1x Veg Biryani, 2x Cold Coffee", total: 500, time: "8 mins ago", status: "READY", type: "DINE_IN" },
  { id: "3", orderNumber: "ORD-1043", table: "Takeaway #3", items: "2x Dal Makhani, 4x Tandoori Roti", total: 560, time: "14 mins ago", status: "SERVED", type: "TAKEAWAY" },
  { id: "4", orderNumber: "ORD-1042", table: "Table 2", items: "1x Kadhai Paneer, 2x Garlic Naan, 1x Sweet Lassi", total: 580, time: "22 mins ago", status: "PAID", type: "QR_ORDER" },
  { id: "5", orderNumber: "ORD-1041", table: "Table 7", items: "1x Margherita Pizza, 1x Mocktail Blue Lagoon", total: 490, time: "35 mins ago", status: "PAID", type: "DINE_IN" },
];

export default function DemoDashboardPage() {
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Onboarding CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Restaurant Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview for today · Connaught Place Branch · INR (₹)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/demo/pos">
            <Button className="h-9 gap-1.5 shadow-sm">
              <UtensilsCrossed className="size-4" />
              Open POS Register
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button variant="outline" className="h-9 gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400">
              <Sparkles className="size-4" />
              Setup My Restaurant
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="col-span-2 border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Today&apos;s Revenue
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Wallet className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">₹48,250</div>
            <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="mr-1 size-3" />
              +14% vs yesterday
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Today&apos;s Orders
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <ReceiptText className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">42</div>
            <p className="mt-1 text-xs text-muted-foreground">
              31 Dine-in · 7 Takeaway · 4 QR
            </p>
          </CardContent>
        </Card>

        {/* Occupied Tables */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active Tables
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Store className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">8 / 16</div>
            <p className="mt-1 text-xs text-muted-foreground">
              50% floor occupancy right now
            </p>
          </CardContent>
        </Card>

        {/* Kitchen Queue */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kitchen Queue
            </CardTitle>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
              <Flame className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">5 tickets</div>
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              Avg. prep time: 11 mins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/demo/pos" className="group rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="mt-3 font-semibold text-sm">POS Terminal</h3>
          <p className="text-xs text-muted-foreground">Fast order punching &amp; billing</p>
        </Link>

        <Link href="/demo/kds" className="group rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600 group-hover:scale-105 transition-transform">
              <ChefHat className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="mt-3 font-semibold text-sm">Kitchen KDS</h3>
          <p className="text-xs text-muted-foreground">Cook orders &amp; ticket timers</p>
        </Link>

        <Link href="/demo/tables" className="group rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 group-hover:scale-105 transition-transform">
              <Store className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="mt-3 font-semibold text-sm">Table Layout</h3>
          <p className="text-xs text-muted-foreground">Floors, seating &amp; QR tokens</p>
        </Link>

        <Link href="/demo/menu" className="group rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 group-hover:scale-105 transition-transform">
              <ClipboardList className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="mt-3 font-semibold text-sm">Menu Catalog</h3>
          <p className="text-xs text-muted-foreground">Dishes, modifiers &amp; prices</p>
        </Link>
      </div>

      {/* Middle Section: 7-Day Revenue Trend & Channel Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Bar Chart */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Weekly Sales Volume</CardTitle>
                <CardDescription>Daily revenue past 7 days (INR)</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Total: ₹3.12 Lakhs
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-52 items-end gap-3 pt-6">
              {[
                { day: "Mon", amount: 38000, height: "65%" },
                { day: "Tue", amount: 41000, height: "70%" },
                { day: "Wed", amount: 36500, height: "60%" },
                { day: "Thu", amount: 45000, height: "78%" },
                { day: "Fri", amount: 56000, height: "92%" },
                { day: "Sat", amount: 62000, height: "100%" },
                { day: "Sun", amount: 48250, height: "82%" },
              ].map((bar) => (
                <div key={bar.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground">₹{Math.round(bar.amount / 1000)}k</span>
                  <div className="relative w-full rounded-t-md bg-muted/60 overflow-hidden flex items-end h-36">
                    <div
                      className="w-full rounded-t-md bg-primary transition-all duration-500 hover:opacity-85"
                      style={{ height: bar.height }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground">{bar.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Payment Method */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
            <CardDescription>Collection split today</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" /> UPI Dynamic QR
                </span>
                <span>68% (₹32,810)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" /> Cash
                </span>
                <span>24% (₹11,580)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "24%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" /> Credit/Debit Card
                </span>
                <span>8% (₹3,860)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "8%" }} />
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">GST Summary:</span> CGST ₹1,148 + SGST ₹1,148 calculated on tax-inclusive billing.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Recent Transactions */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Live Orders &amp; Billing Stream</CardTitle>
            <CardDescription>Click any order to preview invoice &amp; item breakdown</CardDescription>
          </div>
          <Link href="/demo/orders">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Orders →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/80 text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Table / Channel</th>
                  <th className="py-2.5 px-3">Items Summary</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {INITIAL_ORDERS.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-3 px-3 font-mono font-medium text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-foreground">{order.table}</span>
                      <span className="block text-xs text-muted-foreground capitalize">
                        {order.type.toLowerCase().replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-muted-foreground">
                      {order.items}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">
                      {order.time}
                    </td>
                    <td className="py-3 px-3 font-semibold text-foreground">
                      ₹{order.total}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          order.status === "PAID"
                            ? "default"
                            : order.status === "READY"
                              ? "outline"
                              : "secondary"
                        }
                        className={cn(
                          "text-[10px] font-medium",
                          order.status === "PAID" && "bg-emerald-600 text-white hover:bg-emerald-700",
                          order.status === "PREPARING" && "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
                          order.status === "READY" && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                        )}
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Click-to-Inspect Order Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold">
                  {selectedOrder.orderNumber}
                </DialogTitle>
                <Badge>{selectedOrder.status}</Badge>
              </div>
              <DialogDescription>
                {selectedOrder.table} · {selectedOrder.time} · Simulated Order
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-3 border-y border-border/80">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ordered Items
              </h4>
              <p className="text-sm font-medium leading-relaxed">{selectedOrder.items}</p>
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{(selectedOrder.total * 0.952).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST (5% Inclusive)</span>
                <span>₹{(selectedOrder.total * 0.048).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Grand Total</span>
                <span className="text-primary">₹{selectedOrder.total}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Link href="/demo/pos">
                <Button size="sm">Open in POS</Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
