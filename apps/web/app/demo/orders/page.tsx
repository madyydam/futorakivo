"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  PackageCheck,
  Printer,
  ReceiptText,
  Search,
  Timer,
  X,
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type OrderTab = "pending" | "active" | "history";
export type OrderChannel = "ONLINE" | "STAFF";
export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "QR_ORDER";

interface DemoOrderItem {
  name: string;
  qty: number;
  price: number;
}

interface DemoOrderRecord {
  id: string;
  orderNumber: string;
  tab: OrderTab;
  channel: OrderChannel;
  type: OrderType;
  typeLabel: string;
  tableOrToken: string;
  customerName: string;
  customerPhone?: string;
  items: DemoOrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentMode: "UPI" | "CASH" | "CARD";
  status: "PENDING" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "PAID" | "COMPLETED" | "CANCELLED";
  time: string;
}

const INITIAL_DEMO_ORDERS: DemoOrderRecord[] = [
  // --- TAB: pending (New / to accept) ---
  {
    id: "p1",
    orderNumber: "ORD-3101",
    tab: "pending",
    channel: "ONLINE",
    type: "QR_ORDER",
    typeLabel: "Online QR",
    tableOrToken: "Table 4",
    customerName: "Rahul Sharma",
    customerPhone: "+91 98201 44512",
    items: [
      { name: "Paneer Tikka", qty: 2, price: 580 },
      { name: "Garlic Naan", qty: 2, price: 190 },
      { name: "Jeera Rice", qty: 1, price: 180 },
    ],
    subtotal: 950,
    cgst: 24,
    sgst: 24,
    total: 998,
    paymentMode: "UPI",
    status: "PENDING",
    time: "2 mins ago",
  },
  {
    id: "p2",
    orderNumber: "ORD-3102",
    tab: "pending",
    channel: "STAFF",
    type: "TAKEAWAY",
    typeLabel: "Takeaway",
    tableOrToken: "Takeaway #4",
    customerName: "Pooja Varma",
    customerPhone: "+91 94230 88219",
    items: [
      { name: "Chicken Dum Biryani", qty: 1, price: 380 },
      { name: "Boondi Raita", qty: 1, price: 90 },
      { name: "Thums Up (Can)", qty: 2, price: 100 },
    ],
    subtotal: 570,
    cgst: 14,
    sgst: 14,
    total: 598,
    paymentMode: "CASH",
    status: "PENDING",
    time: "5 mins ago",
  },
  {
    id: "p3",
    orderNumber: "ORD-3103",
    tab: "pending",
    channel: "ONLINE",
    type: "DELIVERY",
    typeLabel: "Delivery",
    tableOrToken: "Delivery #12",
    customerName: "Amit Patel",
    customerPhone: "+91 98451 90123",
    items: [
      { name: "Butter Paneer Masala", qty: 1, price: 340 },
      { name: "Tandoori Butter Roti", qty: 4, price: 160 },
      { name: "Gulab Jamun (2 pcs)", qty: 1, price: 120 },
    ],
    subtotal: 620,
    cgst: 15,
    sgst: 15,
    total: 650,
    paymentMode: "UPI",
    status: "PENDING",
    time: "8 mins ago",
  },
  {
    id: "p4",
    orderNumber: "ORD-3104",
    tab: "pending",
    channel: "ONLINE",
    type: "QR_ORDER",
    typeLabel: "Online QR",
    tableOrToken: "Table 9",
    customerName: "Self-Order QR",
    items: [
      { name: "Margherita Pizza (10\")", qty: 1, price: 390 },
      { name: "Iced Cold Coffee", qty: 2, price: 260 },
    ],
    subtotal: 650,
    cgst: 16,
    sgst: 16,
    total: 682,
    paymentMode: "UPI",
    status: "PENDING",
    time: "11 mins ago",
  },

  // --- TAB: active (In progress) ---
  {
    id: "a1",
    orderNumber: "ORD-3095",
    tab: "active",
    channel: "STAFF",
    type: "DINE_IN",
    typeLabel: "Dine-in",
    tableOrToken: "Table 2",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 98112 33490",
    items: [
      { name: "Dal Makhani", qty: 1, price: 320 },
      { name: "Butter Naan", qty: 4, price: 260 },
      { name: "Sweet Lassi", qty: 2, price: 220 },
    ],
    subtotal: 800,
    cgst: 20,
    sgst: 20,
    total: 840,
    paymentMode: "UPI",
    status: "PREPARING",
    time: "14 mins ago",
  },
  {
    id: "a2",
    orderNumber: "ORD-3096",
    tab: "active",
    channel: "STAFF",
    type: "TAKEAWAY",
    typeLabel: "Takeaway",
    tableOrToken: "Takeaway #3",
    customerName: "Sneha Kulkarni",
    customerPhone: "+91 91672 55012",
    items: [
      { name: "Kadhai Paneer", qty: 1, price: 310 },
      { name: "Roomali Roti", qty: 3, price: 150 },
    ],
    subtotal: 460,
    cgst: 12,
    sgst: 12,
    total: 484,
    paymentMode: "UPI",
    status: "READY",
    time: "18 mins ago",
  },
  {
    id: "a3",
    orderNumber: "ORD-3097",
    tab: "active",
    channel: "ONLINE",
    type: "DELIVERY",
    typeLabel: "Delivery",
    tableOrToken: "Delivery #11",
    customerName: "Karan Joshi",
    customerPhone: "+91 97654 33210",
    items: [
      { name: "Hyderabadi Chicken Biryani", qty: 2, price: 780 },
      { name: "Mirchi Ka Salan", qty: 1, price: 110 },
    ],
    subtotal: 890,
    cgst: 22,
    sgst: 22,
    total: 934,
    paymentMode: "CARD",
    status: "OUT_FOR_DELIVERY",
    time: "22 mins ago",
  },
  {
    id: "a4",
    orderNumber: "ORD-3098",
    tab: "active",
    channel: "STAFF",
    type: "DINE_IN",
    typeLabel: "Dine-in",
    tableOrToken: "Table 12",
    customerName: "Ananya Roy",
    customerPhone: "+91 98220 11984",
    items: [
      { name: "Butter Chicken", qty: 1, price: 420 },
      { name: "Garlic Naan", qty: 2, price: 190 },
      { name: "Mocktail Blue Lagoon", qty: 2, price: 320 },
    ],
    subtotal: 930,
    cgst: 23,
    sgst: 23,
    total: 976,
    paymentMode: "CARD",
    status: "PREPARING",
    time: "25 mins ago",
  },
  {
    id: "a5",
    orderNumber: "ORD-3099",
    tab: "active",
    channel: "ONLINE",
    type: "QR_ORDER",
    typeLabel: "Online QR",
    tableOrToken: "Table 6",
    customerName: "Arjun Rao",
    customerPhone: "+91 99887 66554",
    items: [
      { name: "Crispy Chilli Baby Corn", qty: 1, price: 260 },
      { name: "Veg Hakka Noodles", qty: 1, price: 240 },
    ],
    subtotal: 500,
    cgst: 13,
    sgst: 13,
    total: 526,
    paymentMode: "UPI",
    status: "READY",
    time: "32 mins ago",
  },

  // --- TAB: history (Completed / Paid) ---
  {
    id: "h1",
    orderNumber: "ORD-3081",
    tab: "history",
    channel: "STAFF",
    type: "DINE_IN",
    typeLabel: "Dine-in",
    tableOrToken: "Table 7",
    customerName: "Gaurav Mehta",
    customerPhone: "+91 98334 55120",
    items: [
      { name: "Murgh Malai Tikka", qty: 2, price: 680 },
      { name: "Butter Naan", qty: 3, price: 195 },
      { name: "Iced Masala Chai", qty: 2, price: 240 },
    ],
    subtotal: 1115,
    cgst: 28,
    sgst: 28,
    total: 1171,
    paymentMode: "CASH",
    status: "PAID",
    time: "1.2 hrs ago",
  },
  {
    id: "h2",
    orderNumber: "ORD-3082",
    tab: "history",
    channel: "STAFF",
    type: "TAKEAWAY",
    typeLabel: "Takeaway",
    tableOrToken: "Takeaway #1",
    customerName: "Kunal Shah",
    customerPhone: "+91 98450 12345",
    items: [
      { name: "Dal Tadka", qty: 2, price: 440 },
      { name: "Tandoori Roti", qty: 6, price: 240 },
    ],
    subtotal: 680,
    cgst: 17,
    sgst: 17,
    total: 714,
    paymentMode: "UPI",
    status: "PAID",
    time: "1.8 hrs ago",
  },
  {
    id: "h3",
    orderNumber: "ORD-3083",
    tab: "history",
    channel: "ONLINE",
    type: "DELIVERY",
    typeLabel: "Delivery",
    tableOrToken: "Delivery #10",
    customerName: "Meera Deshmukh",
    customerPhone: "+91 99201 88345",
    items: [
      { name: "Veg Pulao with Raita", qty: 1, price: 290 },
      { name: "Kadhai Paneer", qty: 1, price: 310 },
      { name: "Gulab Jamun (2 pcs)", qty: 2, price: 240 },
    ],
    subtotal: 840,
    cgst: 21,
    sgst: 21,
    total: 882,
    paymentMode: "CARD",
    status: "COMPLETED",
    time: "2.4 hrs ago",
  },
  {
    id: "h4",
    orderNumber: "ORD-3084",
    tab: "history",
    channel: "STAFF",
    type: "DINE_IN",
    typeLabel: "Dine-in",
    tableOrToken: "Table 1",
    customerName: "Suresh Iyer",
    customerPhone: "+91 97690 44321",
    items: [
      { name: "Tandoori Platter (Full)", qty: 1, price: 890 },
      { name: "Butter Naan", qty: 4, price: 260 },
      { name: "Matka Kulfi", qty: 2, price: 240 },
    ],
    subtotal: 1390,
    cgst: 35,
    sgst: 35,
    total: 1460,
    paymentMode: "UPI",
    status: "PAID",
    time: "3.1 hrs ago",
  },
  {
    id: "h5",
    orderNumber: "ORD-3085",
    tab: "history",
    channel: "ONLINE",
    type: "QR_ORDER",
    typeLabel: "Online QR",
    tableOrToken: "Table 3",
    customerName: "Rohan Verma",
    customerPhone: "+91 98210 99887",
    items: [
      { name: "Classic Veg Burger", qty: 2, price: 320 },
      { name: "Peri Peri French Fries", qty: 1, price: 140 },
      { name: "Coca Cola (Can)", qty: 2, price: 120 },
    ],
    subtotal: 580,
    cgst: 14,
    sgst: 14,
    total: 608,
    paymentMode: "UPI",
    status: "PAID",
    time: "3.8 hrs ago",
  },
  {
    id: "h6",
    orderNumber: "ORD-3086",
    tab: "history",
    channel: "ONLINE",
    type: "DELIVERY",
    typeLabel: "Delivery",
    tableOrToken: "Delivery #9",
    customerName: "Aditi Nair",
    customerPhone: "+91 91670 22334",
    items: [
      { name: "Paneer Tikka Masala", qty: 1, price: 340 },
      { name: "Garlic Butter Naan", qty: 4, price: 380 },
    ],
    subtotal: 720,
    cgst: 18,
    sgst: 18,
    total: 756,
    paymentMode: "UPI",
    status: "COMPLETED",
    time: "4.5 hrs ago",
  },
  {
    id: "h7",
    orderNumber: "ORD-3087",
    tab: "history",
    channel: "STAFF",
    type: "DINE_IN",
    typeLabel: "Dine-in",
    tableOrToken: "Table 11",
    customerName: "Nikhil Kadam",
    customerPhone: "+91 98450 77665",
    items: [
      { name: "Royal Veg Thali", qty: 2, price: 680 },
      { name: "Masala Chaas", qty: 2, price: 100 },
    ],
    subtotal: 780,
    cgst: 19,
    sgst: 19,
    total: 818,
    paymentMode: "CASH",
    status: "PAID",
    time: "5.2 hrs ago",
  },
];

const MAIN_TABS: { key: OrderTab; label: string }[] = [
  { key: "pending", label: "New (to accept)" },
  { key: "active", label: "In progress" },
  { key: "history", label: "History" },
];

const FILTER_CHIPS = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
  { key: "takeaway", label: "Takeaway" },
  { key: "delivery", label: "Delivery" },
  { key: "dinein", label: "Dine-in" },
];

export default function DemoOrdersPage() {
  const [orders, setOrders] = useState<DemoOrderRecord[]>(INITIAL_DEMO_ORDERS);
  const [activeTab, setActiveTab] = useState<OrderTab>("pending");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<DemoOrderRecord | null>(null);

  // Tab counts
  const counts = useMemo(() => {
    return {
      pending: orders.filter((o) => o.tab === "pending").length,
      active: orders.filter((o) => o.tab === "active").length,
      history: orders.filter((o) => o.tab === "history").length,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Tab match
      if (o.tab !== activeTab) return false;

      // 2. Chip filter match
      if (activeFilter === "online" && o.channel !== "ONLINE") return false;
      if (activeFilter === "offline" && o.channel !== "STAFF") return false;
      if (activeFilter === "takeaway" && o.type !== "TAKEAWAY") return false;
      if (activeFilter === "delivery" && o.type !== "DELIVERY") return false;
      if (activeFilter === "dinein" && o.type !== "DINE_IN" && o.type !== "QR_ORDER") return false;

      // 3. Search query match
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesNumber = o.orderNumber.toLowerCase().includes(q);
        const matchesCustomer = o.customerName.toLowerCase().includes(q);
        const matchesTable = o.tableOrToken.toLowerCase().includes(q);
        const matchesItem = o.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchesNumber && !matchesCustomer && !matchesTable && !matchesItem) return false;
      }

      return true;
    });
  }, [orders, activeTab, activeFilter, search]);

  // Order actions
  const handleAccept = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, tab: "active", status: "PREPARING" } : o)),
    );
  };

  const handleReject = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, tab: "history", status: "CANCELLED" } : o)),
    );
  };

  const handleMarkReady = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "READY" } : o)),
    );
  };

  const handleComplete = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, tab: "history", status: "PAID" } : o)),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Title and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-slate-900 dark:text-white">
            Orders &amp; Invoices
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Realtime dining, takeaway, delivery &amp; QR order dispatch ledger
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order #, customer, table, items…"
            className="h-10 pl-10 rounded-full border-slate-200/80 dark:border-border bg-white dark:bg-card text-xs shadow-2xs"
          />
        </div>
      </div>

      {/* Main Tabs (New, In progress, History) with Count Badges */}
      <div className="flex items-center gap-2 border-b border-sidebar-border/30 pb-3">
        {MAIN_TABS.map((t) => {
          const isActive = activeTab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 shadow-2xs",
                isActive
                  ? "bg-gradient-to-r from-[#9f1239] to-[#881337] text-white shadow-md shadow-[#9f1239]/20"
                  : "bg-white dark:bg-card border border-slate-200/80 dark:border-border text-slate-700 dark:text-slate-300 hover:bg-slate-50",
              )}
            >
              <span>{t.label}</span>
              <span
                className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-[#9f1239]/10 text-[#9f1239] dark:bg-rose-950/40 dark:text-rose-400",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_CHIPS.map((chip) => {
          const isSelected = activeFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActiveFilter(chip.key)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-150 shadow-2xs",
                isSelected
                  ? "bg-[#9f1239] text-white"
                  : "bg-white dark:bg-card border border-slate-200/80 dark:border-border text-slate-600 dark:text-slate-300 hover:bg-slate-50",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Orders Table with Solid White Card */}
      <Card className="rounded-[26px] bg-white dark:bg-card border border-slate-200/80 dark:border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/40 bg-slate-50/50 dark:bg-muted/20 font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-4 py-3.5">Type &amp; Table</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Items Summary</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Total Amount</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    No orders found matching this tab or filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPending = order.status === "PENDING";
                  const isPreparing = order.status === "PREPARING";
                  const isReady = order.status === "READY";
                  const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";
                  const isPaid = order.status === "PAID" || order.status === "COMPLETED";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-100/50 dark:hover:bg-card/50 transition-colors"
                    >
                      {/* Order Number & Timestamp */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {order.orderNumber}
                        <div className="text-[11px] font-sans font-normal text-muted-foreground mt-0.5">
                          {order.time}
                        </div>
                      </td>

                      {/* Type & Table */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {order.tableOrToken}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] rounded-full mt-1 border-slate-200/80 dark:border-border font-medium"
                        >
                          {order.typeLabel}
                        </Badge>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {order.customerName}
                        </div>
                        {order.customerPhone && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {order.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-4 py-4 max-w-xs truncate text-muted-foreground">
                        {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-4">
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] rounded-full px-2 py-0.5 font-bold"
                        >
                          {order.paymentMode}
                        </Badge>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                        ₹{order.total.toLocaleString("en-IN")}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <Badge
                          className={cn(
                            "text-[10px] font-semibold rounded-full px-2.5 py-0.5 shadow-2xs",
                            isPending &&
                              "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
                            isPreparing &&
                              "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30",
                            isReady &&
                              "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
                            isOutForDelivery &&
                              "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30",
                            isPaid &&
                              "bg-emerald-600 text-white",
                          )}
                        >
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAccept(order.id)}
                                className="h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 gap-1 shadow-2xs"
                              >
                                <Check className="size-3" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(order.id)}
                                className="h-7 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 text-[11px] px-2"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {isPreparing && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkReady(order.id)}
                              className="h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-2.5 gap-1 shadow-2xs"
                            >
                              <PackageCheck className="size-3" />
                              Ready
                            </Button>
                          )}

                          {isReady && (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(order.id)}
                              className="h-7 rounded-full bg-[#9f1239] hover:bg-[#881337] text-white text-[11px] font-semibold px-2.5 shadow-2xs"
                            >
                              Complete
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="h-7 rounded-full gap-1 text-[11px] font-semibold text-[#9f1239] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Eye className="size-3" />
                            Bill
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Digital Tax Invoice Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="sm:max-w-md rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ReceiptText className="size-5 text-[#9f1239]" />
                Tax Invoice · {selectedOrder.orderNumber}
              </DialogTitle>
              <DialogDescription>
                Official GST Tax Invoice copy for dining / accounting records
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Restaurant info */}
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 space-y-1">
                <div className="font-bold text-sm text-foreground">KIVO - HORECA management simplified Pvt Ltd</div>
                <div className="text-muted-foreground text-[11px]">
                  Connaught Place, New Delhi - 110001
                </div>
                <div className="text-muted-foreground text-[10px] font-mono">
                  GSTIN: 07AAAAA0000A1Z5 · FSSAI: 10020011000123
                </div>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-border/50 pb-3">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-semibold text-foreground">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Table / Token: </span>
                  <span className="font-semibold text-foreground">{selectedOrder.tableOrToken}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Mode: </span>
                  <span className="font-semibold text-foreground">{selectedOrder.paymentMode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Channel: </span>
                  <span className="font-semibold text-foreground">{selectedOrder.typeLabel}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-1.5">
                <div className="font-semibold text-muted-foreground text-[11px]">Itemized Order:</div>
                <div className="divide-y divide-border/40 rounded-2xl border border-border/60">
                  {selectedOrder.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between p-2.5">
                      <span className="font-medium text-foreground">
                        {i.name} × {i.qty}
                      </span>
                      <span className="font-mono font-bold">₹{i.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Calculations */}
              <div className="space-y-1 rounded-2xl bg-muted/40 p-3.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono">₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>CGST (2.5%):</span>
                  <span className="font-mono">₹{selectedOrder.cgst}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SGST (2.5%):</span>
                  <span className="font-mono">₹{selectedOrder.sgst}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-xs text-foreground">
                  <span>Net Amount Paid:</span>
                  <span className="font-mono text-[#9f1239] text-base">
                    ₹{selectedOrder.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex-1 gap-2 text-xs rounded-full"
                >
                  <Printer className="size-3.5" />
                  Print Bill
                </Button>
                <Button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 text-xs rounded-full bg-[#9f1239] hover:bg-[#881337] text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
