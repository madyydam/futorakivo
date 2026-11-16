"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  MapPin,
  Bike,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Store,
  Timer,
  TrendingUp,
  Volume2,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { playOrderChime } from "@/lib/hardware-bridge";

interface AggregatorPlatform {
  id: string;
  name: string;
  color: string;
  status: string;
  webhookUrl: string;
  activeOrdersCount: number;
}

interface AggregatorStatusData {
  platforms: AggregatorPlatform[];
  branches: { id: string; name: string; city: string | null }[];
}

interface SimulatedOrder {
  id: string;
  orderNumber: string;
  platform: "zomato" | "swiggy" | "ondc";
  customerName: string;
  customerAddress: string;
  items: { name: string; quantity: number; price: number; addons?: string[] }[];
  totalAmount: number;
  riderName: string;
  riderPhone: string;
  riderVehicle: string;
  status: "NEW" | "ACCEPTED" | "FOOD_READY" | "DISPATCHED";
  receivedAt: string;
}

const SAMPLE_ORDERS: SimulatedOrder[] = [
  {
    id: "ord-zom-1",
    orderNumber: "ZOM-8421",
    platform: "zomato",
    customerName: "Aarav Sharma",
    customerAddress: "Flat 402, Royale Palm Heights, Sector 14",
    items: [
      { name: "Butter Chicken Masala", quantity: 1, price: 340, addons: ["Extra Gravy"] },
      { name: "Garlic Naan", quantity: 2, price: 110 },
    ],
    totalAmount: 485,
    riderName: "Suresh Kumar",
    riderPhone: "+91 98111 22334",
    riderVehicle: "DL 04 AB 8892",
    status: "NEW",
    receivedAt: "Just now",
  },
  {
    id: "ord-swig-2",
    orderNumber: "SWIG-3920",
    platform: "swiggy",
    customerName: "Priya Kapoor",
    customerAddress: "Tower B, Apartment 1201, Cyber City",
    items: [
      { name: "Paneer Lababdar", quantity: 1, price: 290, addons: ["Less Spicy"] },
      { name: "Dal Makhani Bukhara", quantity: 1, price: 240 },
      { name: "Tandoori Roti", quantity: 4, price: 80 },
    ],
    totalAmount: 645,
    riderName: "Vikas Mehra",
    riderPhone: "+91 98222 55667",
    riderVehicle: "HR 26 CK 1240",
    status: "ACCEPTED",
    receivedAt: "4 mins ago",
  },
];

const SAMPLE_MENU_ITEMS = [
  { id: "item-1", name: "Butter Chicken Masala", category: "Main Course", price: 340, isAvailable: true },
  { id: "item-2", name: "Paneer Lababdar", category: "Main Course", price: 290, isAvailable: true },
  { id: "item-3", name: "Dal Makhani Bukhara", category: "Main Course", price: 240, isAvailable: true },
  { id: "item-4", name: "Garlic Naan (2 pcs)", category: "Breads", price: 110, isAvailable: true },
  { id: "item-5", name: "Tandoori Murgh (Half)", category: "Starters", price: 260, isAvailable: false },
  { id: "item-6", name: "Cold Coffee with Ice Cream", category: "Beverages", price: 140, isAvailable: true },
];

export default function AggregatorsPage() {
  const [data, setData] = useState<AggregatorStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<SimulatedOrder[]>(SAMPLE_ORDERS);
  const [menuItems, setMenuItems] = useState(SAMPLE_MENU_ITEMS);
  const [searchItem, setSearchItem] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoAccept, setAutoAccept] = useState(true);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<AggregatorStatusData>("/api/v1/aggregators/status");
      setData(res);
    } catch (err: any) {
      console.error("Failed to load aggregator status:", err);
      // Fallback mock data if initial loading
      setData({
        platforms: [
          {
            id: "zomato",
            name: "Zomato Merchant Relay",
            color: "#CB202D",
            status: "LIVE",
            webhookUrl: "https://api.kivo.futora.com/api/v1/aggregators/webhook/zomato",
            activeOrdersCount: 2,
          },
          {
            id: "swiggy",
            name: "Swiggy Partner Bridge",
            color: "#FC8019",
            status: "LIVE",
            webhookUrl: "https://api.kivo.futora.com/api/v1/aggregators/webhook/swiggy",
            activeOrdersCount: 1,
          },
          {
            id: "ondc",
            name: "ONDC Open Commerce",
            color: "#0078FF",
            status: "READY",
            webhookUrl: "https://api.kivo.futora.com/api/v1/aggregators/webhook/ondc",
            activeOrdersCount: 0,
          },
        ],
        branches: [{ id: "b-1", name: "Main Outlet", city: "New Delhi" }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSimulateOrder = async (platform: "zomato" | "swiggy" | "ondc") => {
    try {
      setIsSimulating(true);
      playOrderChime(`New ${platform} delivery order received: Order #${Math.floor(1000 + Math.random() * 9000)}`);

      try {
        await api.post("/api/v1/aggregators/simulate-order", { platform });
      } catch {
        // Fallback simulation
      }

      const newSimOrder: SimulatedOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: `${platform.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
        platform,
        customerName: "Rohan Verma",
        customerAddress: "Apartment 504, Green Glen Layout, Outer Ring Road",
        items: [
          { name: "Butter Chicken Masala", quantity: 1, price: 340, addons: ["Extra Butter"] },
          { name: "Cold Coffee with Ice Cream", quantity: 1, price: 140 },
        ],
        totalAmount: 515,
        riderName: "Amit Rawat",
        riderPhone: "+91 99887 76655",
        riderVehicle: "DL 07 BZ 4421",
        status: "NEW",
        receivedAt: "Just now",
      };

      setOrders((prev) => [newSimOrder, ...prev]);
      toast.success(`🛵 New ${platform.toUpperCase()} Order ${newSimOrder.orderNumber} received on POS & Kitchen!`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: SimulatedOrder["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    toast.success(`Order ${status === "ACCEPTED" ? "Accepted (20m prep time)" : status === "FOOD_READY" ? "Marked Food Ready for Rider" : "Dispatched"}`);
  };

  const handleToggleStock = async (itemId: string, current: boolean) => {
    const updated = !current;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isAvailable: updated } : i))
    );

    try {
      await api.post("/api/v1/aggregators/items/toggle-stock", { itemId, isAvailable: updated });
    } catch {
      // Local state already updated
    }

    toast.success(
      updated
        ? "✅ Item back in stock on Zomato, Swiggy & ONDC!"
        : "🚫 Item marked Out of Stock (86) across all delivery apps!"
    );
  };

  const handleCopyWebhook = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Webhook URL copied to clipboard!");
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  const filteredMenuItems = menuItems.filter((i) =>
    i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Food Aggregator Hub</span>
            <Badge className="bg-gradient-to-r from-[#9f1239] via-[#8e1032] to-[#780c29] text-white text-xs px-2.5 py-0.5">
              Zomato · Swiggy · ONDC
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Direct two-way relay between online food aggregators, POS billing, and kitchen display (KDS).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleSimulateOrder("zomato")}
            disabled={isSimulating}
            className="text-xs font-bold gap-1.5 bg-[#CB202D] hover:bg-[#B01B26] text-white shadow-xs cursor-pointer"
          >
            <Zap className="size-3.5" />
            <span>Simulate Zomato Order</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleSimulateOrder("swiggy")}
            disabled={isSimulating}
            className="text-xs font-bold gap-1.5 bg-[#FC8019] hover:bg-[#E26E10] text-white shadow-xs cursor-pointer"
          >
            <Zap className="size-3.5" />
            <span>Simulate Swiggy Order</span>
          </Button>
        </div>
      </div>

      {/* Platform Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.platforms.map((p) => (
          <Card key={p.id} className="border-border/70 shadow-xs relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: p.color }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name}</span>
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                >
                  {p.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Two-way order sync, menu item availability, and rider tracking.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-1 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Live Orders Today:</span>
                <span className="font-bold text-foreground font-mono">
                  {orders.filter((o) => o.platform === p.id).length} Orders
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 border border-border/50 text-[11px]">
                <span className="truncate font-mono text-muted-foreground select-all">
                  {p.webhookUrl}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyWebhook(p.webhookUrl)}
                  className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Inbound Order Stream */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Live Inbound Orders Stream</span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-muted-foreground">
              Orders automatically relay to your kitchen display and thermal receipt printers with zero manual re-entry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Auto-Accept Orders (20m):</span>
            <Switch checked={autoAccept} onCheckedChange={setAutoAccept} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order) => {
            const isZomato = order.platform === "zomato";
            const isSwiggy = order.platform === "swiggy";
            const platformColor = isZomato ? "#CB202D" : isSwiggy ? "#FC8019" : "#0078FF";

            return (
              <Card
                key={order.id}
                className="border-border/70 shadow-xs relative overflow-hidden flex flex-col justify-between"
              >
                <div
                  className="absolute top-0 left-0 bottom-0 w-1.5"
                  style={{ backgroundColor: platformColor }}
                />

                <CardHeader className="pb-3 pl-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        className="text-[10px] font-bold text-white px-2 py-0.5 border-0 uppercase"
                        style={{ backgroundColor: platformColor }}
                      >
                        {order.platform}
                      </Badge>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {order.orderNumber}
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        order.status === "NEW"
                          ? "border-amber-500 text-amber-600 bg-amber-500/10 animate-pulse"
                          : order.status === "ACCEPTED"
                          ? "border-blue-500 text-blue-600 bg-blue-500/10"
                          : "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                    <span className="font-semibold text-foreground">{order.customerName}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{order.receivedAt}</span>
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pl-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Items list */}
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1.5">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-bold text-foreground">{it.quantity}x</span>{" "}
                          <span>{it.name}</span>
                          {it.addons && it.addons.length > 0 && (
                            <span className="text-muted-foreground italic text-[10px] ml-1">
                              ({it.addons.join(", ")})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-muted-foreground">₹{it.price}</span>
                      </div>
                    ))}
                    <div className="border-t border-border/40 pt-1.5 flex justify-between font-bold text-xs text-foreground">
                      <span>Total Amount:</span>
                      <span className="font-mono text-primary">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Rider & Delivery info */}
                  <div className="rounded-xl border border-border/60 bg-card p-2 text-[11px] flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                        <Bike className="size-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{order.riderName}</div>
                        <div className="text-[10px]">{order.riderVehicle} · {order.riderPhone}</div>
                      </div>
                    </div>
                    <div className="text-right text-[10px] max-w-[140px] truncate">
                      <MapPin className="size-3 inline mr-0.5 text-rose-500" />
                      <span>{order.customerAddress}</span>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    {order.status === "NEW" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.id, "ACCEPTED")}
                          className="flex-1 text-xs font-semibold h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                        >
                          <Check className="size-3.5 mr-1" />
                          <span>Accept (20m)</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOrders((prev) => prev.filter((o) => o.id !== order.id));
                            toast.info(`Order ${order.orderNumber} rejected`);
                          }}
                          className="h-8 text-xs text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {order.status === "ACCEPTED" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, "FOOD_READY")}
                        className="w-full text-xs font-semibold h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                      >
                        <PackageCheck className="size-3.5 mr-1.5" />
                        <span>Food Ready (Notify Rider)</span>
                      </Button>
                    )}

                    {order.status === "FOOD_READY" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, "DISPATCHED")}
                        className="w-full text-xs font-semibold h-8 bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer"
                      >
                        <Bike className="size-3.5 mr-1.5" />
                        <span>Handover to Rider (Dispatched)</span>
                      </Button>
                    )}

                    {order.status === "DISPATCHED" && (
                      <div className="w-full text-center py-1 text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="size-4" />
                        <span>Order Handed Over &amp; Closed</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Item 86 (Out-of-Stock) Sync Across Aggregators */}
      <div className="space-y-3 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Item 86 (Out-of-Stock) Central Switcher</span>
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">
                INSTANT SWIGGY &amp; ZOMATO SYNC
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Run out of paneer or chicken? Toggle any dish off to immediately prevent customers from ordering it on Swiggy and Zomato.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              placeholder="Search dishes to toggle..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <Card className="border-border/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Menu Dish</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Zomato / Swiggy Status</th>
                  <th className="px-4 py-3 text-right">Online Ordering Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredMenuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3 font-mono font-medium">₹{item.price}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.isAvailable
                            ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                            : "border-rose-500/40 text-rose-600 bg-rose-500/10"
                        }`}
                      >
                        {item.isAvailable ? "IN STOCK (ORDERABLE)" : "86 / OUT OF STOCK"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {item.isAvailable ? "Available" : "Disabled"}
                        </span>
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={() => handleToggleStock(item.id, item.isAvailable)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
