"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoReportsPage() {
  const [range, setRange] = useState<"Today" | "Yesterday" | "Last 7 Days" | "This Month">("Today");

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Sales &amp; GST Analytics</h1>
          <p className="text-xs text-muted-foreground">
            Audited financial ledger, Indian GST breakdown (5%), payment distribution &amp; dish velocity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const element = document.createElement("a");
              const file = new Blob(["Invoice,Date,Subtotal,CGST,SGST,Total\nORD-2984,2026-11-08,1380,35,35,1450"], { type: "text/csv" });
              element.href = URL.createObjectURL(file);
              element.download = `GSTR1_Report_${range}.csv`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="size-3.5" />
            Export GSTR-1 CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {(["Today", "Yesterday", "Last 7 Days", "This Month"] as const).map((r) => (
          <Button
            key={r}
            variant={range === r ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(r)}
            className="h-8 text-xs font-medium"
          >
            {r}
          </Button>
        ))}
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Net Sales Revenue
            </CardTitle>
            <IndianRupee className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹84,250</div>
            <p className="mt-1 flex items-center text-xs text-emerald-600">
              <TrendingUp className="mr-1 size-3" />
              +16.4% vs last period
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>
            <Receipt className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="mt-1 text-xs text-muted-foreground">Avg. 18 orders / hour</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Average Order Value (AOV)
            </CardTitle>
            <BarChart3 className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹593</div>
            <p className="mt-1 text-xs text-emerald-600 flex items-center">
              <ArrowUpRight className="mr-1 size-3" />
              +₹42 compared to target
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total GST Collected (5%)
            </CardTitle>
            <FileSpreadsheet className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹4,212.50</div>
            <p className="mt-1 text-xs text-muted-foreground">CGST ₹2,106.25 · SGST ₹2,106.25</p>
          </CardContent>
        </Card>
      </div>

      {/* Indian GST Compliance Box */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-card to-amber-500/[0.03] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-amber-500" />
              <CardTitle className="text-sm font-semibold">Indian GST GSTR-1 Output Tax Breakdown</CardTitle>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              FSSAI / GST Compliant
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-background/50 p-4 sm:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">Taxable Turnover</div>
              <div className="text-lg font-bold font-mono text-foreground mt-0.5">₹80,037.50</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">CGST (2.5%)</div>
              <div className="text-lg font-bold font-mono text-foreground mt-0.5">₹2,106.25</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">SGST (2.5%)</div>
              <div className="text-lg font-bold font-mono text-foreground mt-0.5">₹2,106.25</div>
            </div>
            <div>
              <div className="text-xs text-emerald-600 font-medium">Net Output Tax</div>
              <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">₹4,212.50</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Columns: Payment Modes & Top Dishes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment Methods */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Payment Mode Distribution</span>
              <Wallet className="size-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span>UPI (GPay / PhonePe / Paytm / QR)</span>
                <span className="font-mono">68% · ₹57,290</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span>Credit &amp; Debit Cards</span>
                <span className="font-mono">22% · ₹18,535</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "22%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span>Cash Counter</span>
                <span className="font-mono">10% · ₹8,425</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "10%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Dishes */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Top 5 Selling Items</span>
              <BarChart3 className="size-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { rank: 1, name: "Dal Makhani (Slow-Cooked)", qty: 48, revenue: "₹15,360" },
              { rank: 2, name: "Butter Chicken", qty: 34, revenue: "₹14,280" },
              { rank: 3, name: "Butter Naan", qty: 142, revenue: "₹9,230" },
              { rank: 4, name: "Paneer Tikka (Tandoori)", qty: 29, revenue: "₹8,410" },
              { rank: 5, name: "Sweet Lassi (Kulhad)", qty: 45, revenue: "₹4,950" },
            ].map((dish) => (
              <div key={dish.rank} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted font-bold text-[10px]">
                    {dish.rank}
                  </span>
                  <span className="font-medium text-foreground">{dish.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-foreground">{dish.revenue}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">({dish.qty} sold)</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

