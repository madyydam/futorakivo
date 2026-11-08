"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Plus,
  Sparkles,
  Timer,
  Utensils,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface KitchenItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  done: boolean;
}

interface KitchenTicket {
  id: string;
  ticketNumber: string;
  table: string;
  server: string;
  elapsedMinutes: number;
  status: "NEW" | "COOKING" | "READY" | "SERVED";
  type: "Dine-in" | "Takeaway" | "Swiggy";
  items: KitchenItem[];
}

const INITIAL_TICKETS: KitchenTicket[] = [
  {
    id: "t1",
    ticketNumber: "#K-104",
    table: "Table 4",
    server: "Rohan",
    elapsedMinutes: 14,
    status: "COOKING",
    type: "Dine-in",
    items: [
      { id: "i1", name: "Paneer Tikka (Tandoori)", quantity: 2, notes: "Crispy charred, extra green chutney", done: true },
      { id: "i2", name: "Dal Makhani", quantity: 1, done: false },
      { id: "i3", name: "Butter Naan", quantity: 4, done: false },
    ],
  },
  {
    id: "t2",
    ticketNumber: "#K-105",
    table: "Table 12",
    server: "Priya",
    elapsedMinutes: 6,
    status: "NEW",
    type: "Dine-in",
    items: [
      { id: "i4", name: "Hyderabadi Chicken Biryani", quantity: 2, notes: "Double spicy, separate salan", done: false },
      { id: "i5", name: "Sweet Lassi Kulhad", quantity: 2, done: false },
    ],
  },
  {
    id: "t3",
    ticketNumber: "#K-106",
    table: "Takeaway #2",
    server: "Counter",
    elapsedMinutes: 18,
    status: "COOKING",
    type: "Takeaway",
    items: [
      { id: "i6", name: "Butter Chicken", quantity: 1, done: true },
      { id: "i7", name: "Garlic & Cheese Naan", quantity: 3, done: true },
      { id: "i8", name: "Gulab Jamun with Rabdi", quantity: 2, done: false },
    ],
  },
  {
    id: "t4",
    ticketNumber: "#K-107",
    table: "Table 2",
    server: "Amit",
    elapsedMinutes: 22,
    status: "READY",
    type: "Dine-in",
    items: [
      { id: "i9", name: "Kadhai Paneer", quantity: 1, done: true },
      { id: "i10", name: "Tandoori Roti", quantity: 4, done: true },
    ],
  },
];

export default function DemoKdsPage() {
  const [tickets, setTickets] = useState<KitchenTicket[]>(INITIAL_TICKETS);
  const [filter, setFilter] = useState<"ALL" | "NEW" | "COOKING" | "READY">("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-increment elapsed timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) => ({
          ...t,
          elapsedMinutes: t.elapsedMinutes + 1,
        })),
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleItemDone = (ticketId: string, itemId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          items: t.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
        };
      }),
    );
  };

  const advanceTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev
        .map((t) => {
          if (t.id !== ticketId) return t;
          if (t.status === "NEW") {
            return { ...t, status: "COOKING" as const };
          }
          if (t.status === "COOKING") {
            return {
              ...t,
              status: "READY" as const,
              items: t.items.map((i) => ({ ...i, done: true })),
            };
          }
          if (t.status === "READY") {
            return { ...t, status: "SERVED" as const };
          }
          return t;
        })
        .filter((t) => t.status !== "SERVED"),
    );
  };

  const simulateNewTicket = () => {
    const nextNum = `#K-${Math.floor(108 + Math.random() * 40)}`;
    const newTicket: KitchenTicket = {
      id: "t-" + Date.now(),
      ticketNumber: nextNum,
      table: `Table ${Math.floor(1 + Math.random() * 12)}`,
      server: "Waiter QR",
      elapsedMinutes: 1,
      status: "NEW",
      type: "Dine-in",
      items: [
        { id: "new-1", name: "Murgh Malai Tikka", quantity: 1, notes: "Chef special, mild", done: false },
        { id: "new-2", name: "Butter Naan", quantity: 2, done: false },
      ],
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === "ALL") return true;
    return t.status === filter;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* KDS Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Kitchen Display System (KDS)</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              Live Cooking Queue
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Station: Main Hot Kitchen & Tandoor · Realtime Chef Screen
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled((v) => !v)}
            className="h-8 gap-1.5 text-xs"
          >
            {soundEnabled ? <Volume2 className="size-3.5 text-emerald-600" /> : <VolumeX className="size-3.5 text-muted-foreground" />}
            {soundEnabled ? "Bell Active" : "Muted"}
          </Button>

          <Button
            onClick={simulateNewTicket}
            size="sm"
            className="h-8 gap-1.5 bg-primary text-xs font-semibold shadow-sm"
          >
            <Plus className="size-3.5" />
            + Simulate New Order
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Summary stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(["ALL", "NEW", "COOKING", "READY"] as const).map((s) => {
            const count = s === "ALL" ? tickets.length : tickets.filter((t) => t.status === s).length;
            return (
              <Button
                key={s}
                variant={filter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(s)}
                className="h-8 text-xs font-medium"
              >
                {s} ({count})
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" /> Normal (&lt;10m)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" /> Medium (10-15m)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500 animate-ping" /> Urgent (&gt;15m)
          </span>
        </div>
      </div>

      {/* Ticket Grid */}
      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
          <ChefHat className="size-12 stroke-1 text-muted-foreground opacity-40 mb-3" />
          <h3 className="font-semibold text-foreground">All Orders Prepared!</h3>
          <p className="text-xs text-muted-foreground mt-1">Kitchen queue is empty. Click &quot;+ Simulate New Order&quot; above to test.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTickets.map((ticket) => {
            const isUrgent = ticket.elapsedMinutes > 15;
            const isWarning = ticket.elapsedMinutes > 10 && !isUrgent;

            return (
              <Card
                key={ticket.id}
                className={`flex flex-col border-2 transition-all ${
                  isUrgent
                    ? "border-rose-500 shadow-rose-500/10 shadow-lg bg-rose-500/[0.02]"
                    : isWarning
                    ? "border-amber-500 shadow-amber-500/10 shadow-md"
                    : "border-border/80"
                }`}
              >
                {/* Ticket Header */}
                <CardHeader className="p-3.5 border-b border-border/60 pb-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-foreground">
                      {ticket.ticketNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs font-semibold ${
                        isUrgent
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                          : isWarning
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      }`}
                    >
                      <Timer className="mr-1 size-3 inline" />
                      {ticket.elapsedMinutes} mins
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{ticket.table}</span>
                    <span>Server: {ticket.server}</span>
                  </div>
                </CardHeader>

                {/* Items List */}
                <CardContent className="flex-1 p-3.5 space-y-2">
                  {ticket.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItemDone(ticket.id, item.id)}
                      className={`flex cursor-pointer items-start justify-between rounded-md p-2 text-xs transition-colors ${
                        item.done
                          ? "bg-muted/40 text-muted-foreground line-through opacity-70"
                          : "bg-background hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 font-bold text-primary text-[11px]">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          {item.notes && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => {}}
                        className="mt-0.5 size-4 rounded accent-primary cursor-pointer"
                      />
                    </div>
                  ))}
                </CardContent>

                {/* Status Advancement Action */}
                <CardFooter className="p-3 border-t border-border/60 bg-muted/20">
                  {ticket.status === "NEW" && (
                    <Button
                      onClick={() => advanceTicket(ticket.id)}
                      className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
                    >
                      <Flame className="size-3.5" />
                      Start Cooking
                    </Button>
                  )}
                  {ticket.status === "COOKING" && (
                    <Button
                      onClick={() => advanceTicket(ticket.id)}
                      className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Mark Ready to Serve
                    </Button>
                  )}
                  {ticket.status === "READY" && (
                    <Button
                      onClick={() => advanceTicket(ticket.id)}
                      className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                    >
                      <Utensils className="size-3.5" />
                      Bump / Served
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

