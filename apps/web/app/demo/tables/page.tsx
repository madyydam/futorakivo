"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Coffee,
  Plus,
  Receipt,
  Store,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TableData {
  id: string;
  name: string;
  capacity: number;
  section: "Ground Floor" | "First Floor" | "Rooftop";
  status: "AVAILABLE" | "OCCUPIED" | "BILLED" | "RESERVED";
  guests?: number;
  server?: string;
  elapsedMinutes?: number;
  runningTotal?: number;
  orders?: { name: string; qty: number; price: number }[];
}

const INITIAL_TABLES: TableData[] = [
  {
    id: "t1",
    name: "Table 1",
    capacity: 2,
    section: "Ground Floor",
    status: "OCCUPIED",
    guests: 2,
    server: "Rohan",
    elapsedMinutes: 35,
    runningTotal: 780,
    orders: [
      { name: "Crispy Corn", qty: 1, price: 240 },
      { name: "Dal Makhani", qty: 1, price: 320 },
      { name: "Butter Naan", qty: 2, price: 130 },
      { name: "Sweet Lassi", qty: 1, price: 110 },
    ],
  },
  {
    id: "t2",
    name: "Table 2",
    capacity: 4,
    section: "Ground Floor",
    status: "BILLED",
    guests: 4,
    server: "Amit",
    elapsedMinutes: 55,
    runningTotal: 1840,
    orders: [
      { name: "Murgh Malai Tikka", qty: 2, price: 680 },
      { name: "Butter Chicken", qty: 1, price: 420 },
      { name: "Garlic Naan", qty: 4, price: 380 },
      { name: "Blue Lagoon Mocktail", qty: 2, price: 320 },
    ],
  },
  { id: "t3", name: "Table 3", capacity: 2, section: "Ground Floor", status: "AVAILABLE" },
  {
    id: "t4",
    name: "Table 4",
    capacity: 4,
    section: "Ground Floor",
    status: "OCCUPIED",
    guests: 3,
    server: "Priya",
    elapsedMinutes: 18,
    runningTotal: 940,
    orders: [
      { name: "Paneer Tikka", qty: 1, price: 290 },
      { name: "Kadhai Paneer", qty: 1, price: 310 },
      { name: "Tandoori Roti", qty: 4, price: 160 },
      { name: "Gulab Jamun", qty: 1, price: 180 },
    ],
  },
  { id: "t5", name: "Table 5", capacity: 6, section: "Ground Floor", status: "AVAILABLE" },
  { id: "t6", name: "Table 6", capacity: 4, section: "Ground Floor", status: "AVAILABLE" },
  {
    id: "t7",
    name: "Table 7",
    capacity: 6,
    section: "Ground Floor",
    status: "RESERVED",
    guests: 5,
    server: "Desk",
    elapsedMinutes: 0,
  },
  { id: "t8", name: "Table 8", capacity: 8, section: "Ground Floor", status: "AVAILABLE" },

  {
    id: "t9",
    name: "Table 9",
    capacity: 4,
    section: "First Floor",
    status: "OCCUPIED",
    guests: 4,
    server: "Deepak",
    elapsedMinutes: 28,
    runningTotal: 1250,
    orders: [
      { name: "Hyderabadi Biryani", qty: 2, price: 780 },
      { name: "Sweet Lassi", qty: 3, price: 330 },
      { name: "Kesar Kulfi", qty: 1, price: 140 },
    ],
  },
  { id: "t10", name: "Table 10", capacity: 2, section: "First Floor", status: "AVAILABLE" },
  {
    id: "t11",
    name: "Table 11",
    capacity: 4,
    section: "First Floor",
    status: "BILLED",
    guests: 3,
    server: "Deepak",
    elapsedMinutes: 62,
    runningTotal: 1420,
    orders: [
      { name: "Tandoori Wings", qty: 2, price: 620 },
      { name: "Subz Biryani", qty: 1, price: 330 },
      { name: "Mocktail", qty: 3, price: 480 },
    ],
  },
  { id: "t12", name: "Table 12 (VIP)", capacity: 8, section: "First Floor", status: "AVAILABLE" },

  {
    id: "t13",
    name: "Rooftop T-1",
    capacity: 4,
    section: "Rooftop",
    status: "OCCUPIED",
    guests: 2,
    server: "Sanjay",
    elapsedMinutes: 44,
    runningTotal: 1650,
    orders: [
      { name: "Paneer Tikka", qty: 1, price: 290 },
      { name: "Butter Chicken", qty: 1, price: 420 },
      { name: "Garlic Naan", qty: 3, price: 285 },
      { name: "Dessert Platter", qty: 1, price: 450 },
    ],
  },
  { id: "t14", name: "Rooftop T-2", capacity: 4, section: "Rooftop", status: "AVAILABLE" },
  { id: "t15", name: "Rooftop T-3", capacity: 6, section: "Rooftop", status: "AVAILABLE" },
  { id: "t16", name: "Rooftop VIP Cabana", capacity: 10, section: "Rooftop", status: "AVAILABLE" },
];

export default function DemoTablesPage() {
  const [tables, setTables] = useState<TableData[]>(INITIAL_TABLES);
  const [sectionFilter, setSectionFilter] = useState<string>("All");
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);

  const filteredTables = tables.filter((t) => {
    if (sectionFilter === "All") return true;
    return t.section === sectionFilter;
  });

  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
  const billedCount = tables.filter((t) => t.status === "BILLED").length;
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length;

  const handleSettleTable = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: "AVAILABLE",
              guests: undefined,
              server: undefined,
              elapsedMinutes: undefined,
              runningTotal: undefined,
              orders: undefined,
            }
          : t,
      ),
    );
    setSelectedTable(null);
  };

  const handleSeatGuests = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: "OCCUPIED",
              guests: 2,
              server: "Captain",
              elapsedMinutes: 1,
              runningTotal: 0,
              orders: [],
            }
          : t,
      ),
    );
    setSelectedTable(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Page Title & Section Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Floor Plan & Table Management</h1>
          <p className="text-xs text-muted-foreground">
            Live table occupancy, dine-in orders &amp; settlement · Connaught Place
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/demo/pos">
            <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold shadow-sm">
              <UtensilsCrossed className="size-3.5" />
              Open POS
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Status Badges */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <span className="flex size-3 rounded-full bg-emerald-500" />
          <div>
            <div className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{availableCount}</div>
            <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Available Tables</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <span className="flex size-3 rounded-full bg-amber-500" />
          <div>
            <div className="text-lg font-bold text-amber-800 dark:text-amber-300">{occupiedCount}</div>
            <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Occupied (Dining)</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
          <span className="flex size-3 rounded-full bg-blue-500" />
          <div>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-300">{billedCount}</div>
            <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400">Billed (Awaiting Pay)</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
          <span className="flex size-3 rounded-full bg-purple-500" />
          <div>
            <div className="text-lg font-bold text-purple-800 dark:text-purple-300">{reservedCount}</div>
            <div className="text-[11px] font-medium text-purple-700 dark:text-purple-400">Reserved</div>
          </div>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex gap-1.5 border-b border-border/40 pb-2">
        {["All", "Ground Floor", "First Floor", "Rooftop"].map((sec) => (
          <Button
            key={sec}
            variant={sectionFilter === sec ? "default" : "outline"}
            size="sm"
            onClick={() => setSectionFilter(sec)}
            className="h-8 text-xs font-medium"
          >
            {sec}
          </Button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filteredTables.map((t) => {
          const isOccupied = t.status === "OCCUPIED";
          const isBilled = t.status === "BILLED";
          const isReserved = t.status === "RESERVED";
          const isAvailable = t.status === "AVAILABLE";

          return (
            <Card
              key={t.id}
              onClick={() => setSelectedTable(t)}
              className={`cursor-pointer border-2 transition-all hover:scale-[1.02] hover:shadow-md ${
                isOccupied
                  ? "border-amber-500/60 bg-amber-500/[0.04]"
                  : isBilled
                  ? "border-blue-500/60 bg-blue-500/[0.04]"
                  : isReserved
                  ? "border-purple-500/60 bg-purple-500/[0.04]"
                  : "border-emerald-500/40 bg-emerald-500/[0.02]"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{t.name}</h3>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="size-3" />
                      {t.capacity} Seats
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold uppercase ${
                      isOccupied
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        : isBilled
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                        : isReserved
                        ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    }`}
                  >
                    {t.status}
                  </Badge>
                </div>

                {/* Table Dynamic Status Data */}
                <div className="mt-4 pt-3 border-t border-border/40 text-xs">
                  {isAvailable && (
                    <div className="text-center py-2 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                      + Tap to Seat Guests
                    </div>
                  )}

                  {(isOccupied || isBilled) && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Elapsed Time:</span>
                        <span className="font-mono text-foreground font-medium">{t.elapsedMinutes}m</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Running Bill:</span>
                        <span className="font-bold text-primary">₹{t.runningTotal}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Server:</span>
                        <span>{t.server}</span>
                      </div>
                    </div>
                  )}

                  {isReserved && (
                    <div className="text-center py-2 text-purple-600 dark:text-purple-400 text-[11px] font-medium">
                      Reserved for 8:30 PM (Party of {t.guests})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table Details Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
        {selectedTable && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedTable.name} ({selectedTable.capacity} Seats)</span>
                <Badge variant="outline" className="text-xs">
                  {selectedTable.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Section: {selectedTable.section}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {selectedTable.status === "AVAILABLE" && (
                <div className="text-center space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    This table is clean and ready for seating guests.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSeatGuests(selectedTable.id)}
                      className="flex-1 gap-1.5 text-xs font-semibold"
                    >
                      <Users className="size-3.5" />
                      Seat Guests
                    </Button>
                    <Link href={`/demo/pos`} className="flex-1">
                      <Button variant="secondary" className="w-full gap-1.5 text-xs">
                        <UtensilsCrossed className="size-3.5" />
                        Take Order in POS
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {(selectedTable.status === "OCCUPIED" || selectedTable.status === "BILLED") && (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs border-b border-border/50 pb-2">
                    <span>Assigned Server: <b>{selectedTable.server}</b></span>
                    <span>Seated: <b>{selectedTable.elapsedMinutes} mins ago</b></span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">Running Kitchen Orders:</p>
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 space-y-1 text-xs">
                      {selectedTable.orders?.map((ord, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{ord.qty}x {ord.name}</span>
                          <span className="font-mono">₹{ord.price}</span>
                        </div>
                      ))}
                      <div className="border-t border-border/60 pt-1.5 flex justify-between font-bold text-foreground">
                        <span>Total Running Bill:</span>
                        <span className="text-primary font-mono">₹{selectedTable.runningTotal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href="/demo/pos" className="flex-1">
                      <Button variant="outline" className="w-full text-xs gap-1.5">
                        <UtensilsCrossed className="size-3.5" />
                        Add More Items
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleSettleTable(selectedTable.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Settle & Clear Table
                    </Button>
                  </div>
                </div>
              )}

              {selectedTable.status === "RESERVED" && (
                <div className="text-center space-y-4 py-4">
                  <p className="text-xs text-muted-foreground">
                    Table reserved for tonight at 8:30 PM.
                  </p>
                  <Button
                    onClick={() => handleSeatGuests(selectedTable.id)}
                    className="w-full text-xs font-semibold"
                  >
                    Check In & Seat Guests Now
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

