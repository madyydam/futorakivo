"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Flame,
  Minus,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  category: "Starters" | "Mains" | "Breads" | "Beverages" | "Desserts";
  price: number;
  isVeg: boolean;
  image: string;
  description: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "1", name: "Paneer Tikka (Tandoori)", category: "Starters", price: 290, isVeg: true, image: "🧀", description: "Marinated cottage cheese charred in clay oven" },
  { id: "2", name: "Murgh Malai Tikka", category: "Starters", price: 340, isVeg: false, image: "🍗", description: "Tender chicken steeped in cream and cardamom" },
  { id: "3", name: "Crispy Corn & Waterchestnut", category: "Starters", price: 240, isVeg: true, image: "🌽", description: "Golden fried sweet corn with kaffir lime salt" },
  { id: "4", name: "Tandoori Chicken Wings", category: "Starters", price: 310, isVeg: false, image: "🍖", description: "6 pcs smoky wings with mint dip" },

  { id: "5", name: "Dal Makhani (Slow-Cooked)", category: "Mains", price: 320, isVeg: true, image: "🍲", description: "Cooked overnight with white butter & Kashmiri chilli" },
  { id: "6", name: "Butter Chicken (Old Delhi Style)", category: "Mains", price: 420, isVeg: false, image: "🥘", description: "Boneless tandoori chicken in velvety tomato gravy" },
  { id: "7", name: "Kadhai Paneer", category: "Mains", price: 310, isVeg: true, image: "🫕", description: "Wok-tossed bell peppers, paneer cubes, whole coriander" },
  { id: "8", name: "Hyderabadi Dum Biryani (Chicken)", category: "Mains", price: 390, isVeg: false, image: "🍚", description: "Layered saffron basmati rice with spiced chicken & salan" },
  { id: "9", name: "Subz Handi Biryani", category: "Mains", price: 330, isVeg: true, image: "🍛", description: "Garden vegetables simmered in aromatic basmati rice" },

  { id: "10", name: "Butter Naan", category: "Breads", price: 65, isVeg: true, image: "🫓", description: "Leavened flatbread brushed with butter" },
  { id: "11", name: "Garlic & Cheese Naan", category: "Breads", price: 95, isVeg: true, image: "🧀", description: "Stuffed with melted mozzarella & roasted garlic" },
  { id: "12", name: "Tandoori Roti", category: "Breads", price: 40, isVeg: true, image: "🫓", description: "Crisp whole wheat bread from tandoor" },

  { id: "13", name: "Sweet Lassi (Kulhad)", category: "Beverages", price: 110, isVeg: true, image: "🥛", description: "Thick Punjabi curd topped with malai & pistachios" },
  { id: "14", name: "Blue Lagoon Mocktail", category: "Beverages", price: 160, isVeg: true, image: "🍹", description: "Curacao, lemon fizz, crushed ice" },
  { id: "15", name: "Iced Masala Chai Latte", category: "Beverages", price: 120, isVeg: true, image: "🧋", description: "Brewed Assam tea, whole spices, cold milk" },

  { id: "16", name: "Gulab Jamun with Rabdi", category: "Desserts", price: 180, isVeg: true, image: "🍯", description: "2 hot mawa dumplings on saffron condensed milk" },
  { id: "17", name: "Kesar Pista Kulfi", category: "Desserts", price: 140, isVeg: true, image: "🍨", description: "Traditional clay-pot frozen milk dessert" },
];

const CATEGORIES = ["All", "Starters", "Mains", "Breads", "Beverages", "Desserts"] as const;

export default function DemoPosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([
    { ...MENU_ITEMS[4], quantity: 1 },
    { ...MENU_ITEMS[9], quantity: 2 },
  ]);
  const [table, setTable] = useState("Table 4");
  const [orderType, setOrderType] = useState<"Dine-in" | "Takeaway" | "Delivery">("Dine-in");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH" | "CARD">("UPI");
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    orderNum: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    total: number;
    items: CartItem[];
  } | null>(null);

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = Math.round(subtotal * 0.025);
  const sgst = Math.round(subtotal * 0.025);
  const total = subtotal + cgst + sgst;

  const handleCompletePayment = () => {
    const orderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    setLastOrderDetails({
      orderNum,
      subtotal,
      cgst,
      sgst,
      total,
      items: [...cart],
    });
    setPaymentModalOpen(false);
    setReceiptModalOpen(true);
    setCart([]);
  };

  return (
    <div className="flex flex-col gap-5 lg:h-[calc(100vh-8.5rem)] lg:flex-row">
      {/* Left Column: Menu Items Catalog */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Header Search & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl text-slate-900 dark:text-white">POS Billing Register</h1>
            <p className="text-xs text-muted-foreground">Quick-tap touch terminal · Modexsys HORECA POS</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish or beverage…"
              className="h-10 pl-9 rounded-2xl bg-white dark:bg-card border-slate-200/80 dark:border-border shadow-2xs text-xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "h-8 rounded-full px-3.5 text-xs font-semibold transition-all",
                selectedCategory === cat
                  ? "bg-[#9f1239] hover:bg-[#881337] text-white shadow-xs"
                  : "bg-white dark:bg-card border-slate-200/80 dark:border-border text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Dish Grid - Auto fill responsive, never squeezed */}
        <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(155px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(165px,1fr))] gap-3.5 overflow-y-auto pr-1 pb-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => addToCart(item)}
              className="group cursor-pointer rounded-[22px] bg-white dark:bg-card border border-slate-200/90 dark:border-border p-4 shadow-xs transition-all hover:border-[#9f1239]/40 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[145px]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{item.image}</span>
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-[4px] border",
                      item.isVeg
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-rose-600 bg-rose-50 dark:bg-rose-950/30"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        item.isVeg ? "bg-emerald-600" : "bg-rose-600"
                      )}
                    />
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold leading-tight text-slate-900 dark:text-white group-hover:text-[#9f1239] dark:group-hover:text-rose-400 transition-colors">
                  {item.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-snug">
                  {item.description}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-border/60 pt-2.5">
                <span className="font-mono text-sm font-extrabold tabular-nums text-[#9f1239] dark:text-rose-400">
                  ₹{item.price}
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:bg-[#9f1239] group-hover:text-white transition-colors">
                  +
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Active Order Cart & Billing */}
      <div className="flex w-full flex-col rounded-[26px] border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs lg:w-96">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-primary" />
            <span className="font-semibold text-sm">Current Order</span>
            <Badge variant="outline" className="text-xs">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </Badge>
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCart([])}
              className="h-7 text-xs text-destructive hover:bg-destructive/10"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Order Setup: Type & Table */}
        <div className="grid grid-cols-2 gap-2 py-3 border-b border-border/60">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Order Mode</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as any)}
              className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-medium"
            >
              <option value="Dine-in">Dine-in</option>
              <option value="Takeaway">Takeaway</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Table / Token</label>
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-medium"
            >
              <option value="Table 1">Table 1 (2-seater)</option>
              <option value="Table 2">Table 2 (4-seater)</option>
              <option value="Table 4">Table 4 (4-seater)</option>
              <option value="Table 7">Table 7 (6-seater)</option>
              <option value="Table 12">Table 12 (VIP)</option>
              <option value="Takeaway Counter">Takeaway Counter</option>
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-[160px] max-h-[340px]">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <UtensilsCrossed className="size-8 stroke-1 opacity-40 mb-2" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[11px]">Tap any dish from the left catalog to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-2 text-xs"
              >
                <div className="flex-1 pr-2">
                  <div className="font-medium text-foreground">{item.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="flex size-6 items-center justify-center rounded bg-muted text-foreground hover:bg-muted/80"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="flex size-6 items-center justify-center rounded bg-muted text-foreground hover:bg-muted/80"
                  >
                    <Plus className="size-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-border/60 pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Item Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>CGST (2.5%)</span>
            <span>₹{cgst}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>SGST (2.5%)</span>
            <span>₹{sgst}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border/40">
            <span>Grand Total</span>
            <span className="text-primary">₹{total}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={() => setPaymentModalOpen(true)}
          disabled={cart.length === 0}
          className="mt-4 h-11 w-full gap-2 text-sm font-semibold shadow-md"
        >
          <Receipt className="size-4" />
          Pay & Print Bill (₹{total})
        </Button>
      </div>

      {/* Payment Selection Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-primary" />
              Settle Payment · ₹{total}
            </DialogTitle>
            <DialogDescription>
              Select payment method to complete order for {table}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === "UPI" ? "default" : "outline"}
                size="sm"
                onClick={() => setPaymentMethod("UPI")}
                className="text-xs"
              >
                UPI QR Code
              </Button>
              <Button
                variant={paymentMethod === "CASH" ? "default" : "outline"}
                size="sm"
                onClick={() => setPaymentMethod("CASH")}
                className="text-xs"
              >
                Cash
              </Button>
              <Button
                variant={paymentMethod === "CARD" ? "default" : "outline"}
                size="sm"
                onClick={() => setPaymentMethod("CARD")}
                className="text-xs"
              >
                Card POS
              </Button>
            </div>

            {paymentMethod === "UPI" && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center">
                <div className="size-44 rounded-lg bg-white p-3 shadow-sm border border-neutral-200 flex flex-col items-center justify-center">
                  {/* High visual quality simulated QR code SVG */}
                  <svg viewBox="0 0 100 100" className="size-full">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="24" height="24" fill="black" />
                    <rect x="14" y="14" width="16" height="16" fill="white" />
                    <rect x="18" y="18" width="8" height="8" fill="black" />
                    <rect x="66" y="10" width="24" height="24" fill="black" />
                    <rect x="70" y="14" width="16" height="16" fill="white" />
                    <rect x="74" y="18" width="8" height="8" fill="black" />
                    <rect x="10" y="66" width="24" height="24" fill="black" />
                    <rect x="14" y="70" width="16" height="16" fill="white" />
                    <rect x="18" y="74" width="8" height="8" fill="black" />
                    <rect x="42" y="14" width="6" height="6" fill="black" />
                    <rect x="52" y="24" width="6" height="6" fill="black" />
                    <rect x="42" y="42" width="16" height="16" fill="black" />
                    <rect x="22" y="45" width="6" height="6" fill="black" />
                    <rect x="70" y="52" width="6" height="6" fill="black" />
                    <rect x="80" y="70" width="8" height="8" fill="black" />
                    <rect x="52" y="74" width="8" height="8" fill="black" />
                    <rect x="42" y="80" width="6" height="6" fill="black" />
                  </svg>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold text-foreground">Scan with any UPI App</p>
                  <p className="text-[11px] text-muted-foreground">Google Pay · PhonePe · Paytm · BHIM</p>
                  <p className="mt-1 font-mono text-[10px] text-primary">modexsys.horeca@icici · Amount ₹{total}</p>
                </div>
              </div>
            )}

            {paymentMethod === "CASH" && (
              <div className="rounded-lg border border-border p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tendered Cash Amount:</span>
                  <span className="font-semibold">₹{total}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Change to Return:</span>
                  <span>₹0.00</span>
                </div>
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div className="rounded-lg border border-border p-4 text-center text-xs text-muted-foreground">
                <p>Swipe or Tap card on POS PIN Pad Terminal</p>
                <p className="mt-1 font-mono text-foreground font-semibold">Ready for payment: ₹{total}</p>
              </div>
            )}

            <Button
              onClick={handleCompletePayment}
              className="h-11 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <CheckCircle2 className="size-4" />
              Simulate Successful Payment (₹{total})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Printable Thermal Receipt Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
              Order Placed & Paid!
            </DialogTitle>
            <DialogDescription>
              Receipt generated. Real orders send direct print signals to USB/Bluetooth thermal printer.
            </DialogDescription>
          </DialogHeader>

          {/* Thermal Receipt Paper Card */}
          <div className="mx-auto my-2 w-full max-w-xs rounded-lg border border-neutral-300 bg-white p-5 font-mono text-[11px] text-neutral-800 shadow-inner">
            <div className="text-center space-y-0.5 border-b border-dashed border-neutral-300 pb-3">
              <h4 className="font-bold text-sm tracking-tight">MODEXSYS HORECA</h4>
              <p className="text-[10px] text-neutral-600">Connaught Place, New Delhi - 110001</p>
              <p className="text-[10px] text-neutral-600">GSTIN: 07AAAAA0000A1Z5</p>
              <p className="text-[10px] text-neutral-600">Ph: +91 98765 43210</p>
            </div>

            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Bill No: {lastOrderDetails?.orderNum}</span>
                <span>{table}</span>
              </div>
              <div className="flex justify-between">
                <span>Date: {new Date().toLocaleDateString("en-IN")}</span>
                <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span>Type: {orderType}</span>
                <span>Payment: {paymentMethod}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="py-3 border-b border-dashed border-neutral-300 space-y-1.5">
              {lastOrderDetails?.items.map((item) => (
                <div key={item.id} className="flex justify-between text-[10px]">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{lastOrderDetails?.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>₹{lastOrderDetails?.cgst}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>₹{lastOrderDetails?.sgst}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-neutral-300">
                <span>NET TOTAL:</span>
                <span>₹{lastOrderDetails?.total}</span>
              </div>
            </div>

            <div className="text-center pt-3 text-[10px] text-neutral-500 space-y-0.5">
              <p>Thank you for dining with us!</p>
              <p className="text-[9px]">FSSAI Lic: 10020011000123</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1 gap-2 text-xs"
            >
              <Printer className="size-3.5" />
              Simulate Print
            </Button>
            <Button
              onClick={() => setReceiptModalOpen(false)}
              className="flex-1 gap-2 text-xs"
            >
              Start New Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

