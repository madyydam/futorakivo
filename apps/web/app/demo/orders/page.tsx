"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Printer,
  ReceiptText,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface OrderRecord {
  id: string;
  orderNumber: string;
  type: "Dine-in" | "Takeaway" | "Online QR";
  tableOrToken: string;
  customerName: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentMode: "UPI" | "CASH" | "CARD";
  status: "PAID" | "PREPARING" | "READY";
  time: string;
}

const DEMO_ORDERS: OrderRecord[] = [
  {
    id: "o1",
    orderNumber: "ORD-2984",
    type: "Dine-in",
    tableOrToken: "Table 4",
    customerName: "Vikram Malhotra",
    items: [
      { name: "Paneer Tikka", qty: 2, price: 580 },
      { name: "Dal Makhani", qty: 1, price: 320 },
      { name: "Butter Naan", qty: 4, price: 260 },
      { name: "Sweet Lassi", qty: 2, price: 220 },
    ],
    subtotal: 1380,
    cgst: 35,
    sgst: 35,
    total: 1450,
    paymentMode: "UPI",
    status: "PREPARING",
    time: "10 mins ago",
  },
  {
    id: "o2",
    orderNumber: "ORD-2983",
    type: "Dine-in",
    tableOrToken: "Table 12",
    customerName: "Ananya Roy",
    items: [
      { name: "Butter Chicken", qty: 1, price: 420 },
      { name: "Garlic & Cheese Naan", qty: 3, price: 285 },
      { name: "Gulab Jamun with Rabdi", qty: 2, price: 360 },
    ],
    subtotal: 1065,
    cgst: 27,
    sgst: 27,
    total: 1119,
    paymentMode: "CARD",
    status: "READY",
    time: "24 mins ago",
  },
  {
    id: "o3",
    orderNumber: "ORD-2982",
    type: "Takeaway",
    tableOrToken: "Counter #3",
    customerName: "Kunal Shah",
    items: [
      { name: "Hyderabadi Chicken Biryani", qty: 2, price: 780 },
      { name: "Blue Lagoon Mocktail", qty: 2, price: 320 },
    ],
    subtotal: 1100,
    cgst: 28,
    sgst: 28,
    total: 1156,
    paymentMode: "UPI",
    status: "PAID",
    time: "42 mins ago",
  },
  {
    id: "o4",
    orderNumber: "ORD-2981",
    type: "Online QR",
    tableOrToken: "Table 2",
    customerName: "Self-Order QR",
    items: [
      { name: "Crispy Corn", qty: 1, price: 240 },
      { name: "Kadhai Paneer", qty: 1, price: 310 },
      { name: "Tandoori Roti", qty: 4, price: 160 },
    ],
    subtotal: 710,
    cgst: 18,
    sgst: 18,
    total: 746,
    paymentMode: "UPI",
    status: "PAID",
    time: "1 hr ago",
  },
  {
    id: "o5",
    orderNumber: "ORD-2980",
    type: "Dine-in",
    tableOrToken: "Table 7",
    customerName: "Gaurav Mehta",
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
    time: "1.5 hrs ago",
  },
];

export default function DemoOrdersPage() {
  const [orders] = useState<OrderRecord[]>(DEMO_ORDERS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesType = typeFilter === "All" || o.type === typeFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.tableOrToken.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Page Title & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Orders &amp; Invoices</h1>
          <p className="text-xs text-muted-foreground">
            Complete transaction ledger with GST calculations and digital receipts
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order #, customer or table…"
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["All", "Dine-in", "Takeaway", "Online QR"].map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(t)}
            className="h-8 text-xs"
          >
            {t}
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/60 bg-muted/40 font-medium text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Type &amp; Table</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items Summary</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">
                    {order.orderNumber}
                    <div className="text-[10px] text-muted-foreground font-sans font-normal">
                      {order.time}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{order.tableOrToken}</div>
                    <Badge variant="outline" className="text-[10px] mt-0.5">
                      {order.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground">{order.customerName}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                    {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {order.paymentMode}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-bold font-mono text-foreground text-sm">
                    ₹{order.total}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        order.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : order.status === "READY"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="size-3.5" />
                      View Bill
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Digital Tax Invoice Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ReceiptText className="size-5 text-primary" />
                Tax Invoice · {selectedOrder.orderNumber}
              </DialogTitle>
              <DialogDescription>
                Official GST Tax Invoice copy for dining / accounting records
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Restaurant info */}
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                <div className="font-bold text-sm text-foreground">Modexsys HORECA Pvt Ltd</div>
                <div className="text-muted-foreground text-[11px]">Connaught Place, New Delhi - 110001</div>
                <div className="text-muted-foreground text-[11px] font-mono">GSTIN: 07AAAAA0000A1Z5 · FSSAI: 10020011000123</div>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-border/60 pb-2">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-medium text-foreground">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Table/Location: </span>
                  <span className="font-medium text-foreground">{selectedOrder.tableOrToken}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment: </span>
                  <span className="font-medium text-foreground">{selectedOrder.paymentMode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Order Type: </span>
                  <span className="font-medium text-foreground">{selectedOrder.type}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-1.5">
                <div className="font-semibold text-muted-foreground">Itemized Order:</div>
                <div className="divide-y divide-border/40 rounded-lg border border-border/60">
                  {selectedOrder.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between p-2">
                      <span>{i.name} × {i.qty}</span>
                      <span className="font-mono">₹{i.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Calculations */}
              <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-[11px]">
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
                <div className="flex justify-between border-t border-border/60 pt-1.5 font-bold text-xs text-foreground">
                  <span>Net Amount Paid:</span>
                  <span className="font-mono text-primary text-sm">₹{selectedOrder.total}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex-1 gap-2 text-xs"
                >
                  <Printer className="size-3.5" />
                  Print Bill
                </Button>
                <Button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 text-xs"
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

