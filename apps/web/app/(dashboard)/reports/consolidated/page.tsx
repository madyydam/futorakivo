"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  Building2,
  ChefHat,
  ChevronRight,
  Download,
  IndianRupee,
  Printer,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface ConsolidatedReport {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    activeOutlets: number;
    totalCentralKitchens: number;
    pendingIndentsCount: number;
    totalTransfersCount: number;
  };
  branches: {
    id: string;
    name: string;
    isCentralKitchen: boolean;
    address: string | null;
    phone: string | null;
    revenue: number;
    orderCount: number;
    avgTicket: number;
    lowStockCount: number;
    pendingIndentsCount: number;
  }[];
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  recentIndents: {
    id: string;
    indentNumber: string;
    status: string;
    sourceBranch: { id: string; name: string };
    targetBranch: { id: string; name: string };
    requestedAt: string;
  }[];
  recentTransfers: {
    id: string;
    fromBranchName: string;
    toBranchName: string;
    ingredientName: string;
    quantity: string | number;
    unit: string;
    createdAt: string;
  }[];
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function ConsolidatedReportsPage() {
  const [range, setRange] = useState(() => ({
    from: iso(new Date(Date.now() - 29 * 86_400_000)),
    to: iso(new Date()),
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports", "consolidated", range.from, range.to],
    queryFn: () =>
      api.get<ConsolidatedReport>(
        `/reports/consolidated?from=${range.from}&to=${range.to}`,
      ),
  });

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ["Outlet Name", "Type", "Gross Revenue (INR)", "Orders Count", "Average Ticket (INR)", "Low Stock Alerts", "Pending Indents"],
      ...data.branches.map((b) => [
        `"${b.name}"`,
        b.isCentralKitchen ? "Central Kitchen" : "Outlet",
        b.revenue,
        b.orderCount,
        b.avgTicket,
        b.lowStockCount,
        b.pendingIndentsCount,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kivo_consolidated_brand_report_${range.from}_to_${range.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link
              href="/reports"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Reports
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Consolidated Multi-Outlet Hub</span>
          </div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
            Multi-Outlet Brand Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Petpooja-grade enterprise analytics comparing revenue, kitchen velocity, and supply chain indents across all outlets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Input
            type="date"
            className="w-36 text-xs"
            value={range.from}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            className="w-36 text-xs"
            value={range.to}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
          />
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!data}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-1 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Brand Revenue</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(data?.overview.totalRevenue ?? 0)}
            </div>
          )}
          <span className="text-[11px] text-muted-foreground">
            Across {data?.overview.activeOutlets ?? 0} active outlets
          </span>
        </Card>

        <Card className="flex flex-col gap-1 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Brand Orders</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {data?.overview.totalOrders.toLocaleString("en-IN") ?? 0}
            </div>
          )}
          <span className="text-[11px] text-muted-foreground">
            AOV ticket: {formatCurrency(data?.overview.avgOrderValue ?? 0)}
          </span>
        </Card>

        <Card className="flex flex-col gap-1 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Central Kitchen Network</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <ChefHat className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {data?.overview.totalCentralKitchens ?? 0} Hubs
            </div>
          )}
          <span className="text-[11px] text-muted-foreground">
            Supplying {data?.overview.activeOutlets ?? 0} satellite stores
          </span>
        </Card>

        <Card className="flex flex-col gap-1 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Supply Chain Indents</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {data?.overview.pendingIndentsCount ?? 0} Pending
            </div>
          )}
          <span className="text-[11px] text-muted-foreground">
            {data?.overview.totalTransfersCount ?? 0} total stock movements
          </span>
        </Card>
      </div>

      {/* OUTLETS PERFORMANCE BENCHMARKING TABLE */}
      <Card className="overflow-x-auto p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Outlets Performance Matrix</h3>
            <p className="text-xs text-muted-foreground">
              Real-time comparison of sales contribution, average ticket size, and inventory status
            </p>
          </div>
          <Link
            href="/inventory/transfers"
            className="text-xs font-medium text-primary hover:underline"
          >
            Manage Inter-Branch Indents →
          </Link>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : data && data.branches.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2.5 font-medium">Outlet Name</th>
                <th className="pb-2.5 font-medium">Role</th>
                <th className="pb-2.5 font-medium text-right">Gross Sales</th>
                <th className="pb-2.5 font-medium text-right">Contribution</th>
                <th className="pb-2.5 font-medium text-right">Orders</th>
                <th className="pb-2.5 font-medium text-right">Avg Ticket</th>
                <th className="pb-2.5 font-medium text-center">Low Stock Alert</th>
                <th className="pb-2.5 font-medium text-center">Pending Indent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.branches.map((branch) => {
                const totalRev = data.overview.totalRevenue || 1;
                const sharePct = Math.round((branch.revenue / totalRev) * 100);
                return (
                  <tr key={branch.id} className="hover:bg-secondary/20">
                    <td className="py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-semibold text-foreground">{branch.name}</div>
                          {branch.address && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {branch.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {branch.isCentralKitchen ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                          <ChefHat className="h-3 w-3" /> Central Kitchen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                          Satellite Outlet
                        </span>
                      )}
                    </td>
                    <td className="text-right font-medium text-foreground tabular-nums">
                      {formatCurrency(branch.revenue)}
                    </td>
                    <td className="text-right tabular-nums">
                      <div className="inline-flex items-center gap-1">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(100, sharePct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{sharePct}%</span>
                      </div>
                    </td>
                    <td className="text-right tabular-nums text-foreground">
                      {branch.orderCount.toLocaleString("en-IN")}
                    </td>
                    <td className="text-right tabular-nums text-foreground">
                      {formatCurrency(branch.avgTicket)}
                    </td>
                    <td className="text-center">
                      {branch.lowStockCount > 0 ? (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600">
                          {branch.lowStockCount} items
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Healthy</span>
                      )}
                    </td>
                    <td className="text-center">
                      {branch.pendingIndentsCount > 0 ? (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                          {branch.pendingIndentsCount} open
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No branch data available.</p>
        )}
      </Card>

      {/* LOWER SECTION: TOP ITEMS & RECENT SUPPLY CHAIN ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Menu Items Brand-Wide */}
        <Card className="p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Brand-Wide Top Selling Items</h3>
              <p className="text-xs text-muted-foreground">Highest grossing items across all locations</p>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : data && data.topItems.length > 0 ? (
            <div className="flex flex-col divide-y divide-border">
              {data.topItems.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.quantity} orders fulfilled</div>
                    </div>
                  </div>
                  <div className="text-right font-medium text-foreground">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No order item records found for this range.</p>
          )}
        </Card>

        {/* Recent Supply Chain Requisitions */}
        <Card className="p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Recent Requisition Indents</h3>
              <p className="text-xs text-muted-foreground">Latest inter-branch supply chain tickets</p>
            </div>
            <Boxes className="h-4 w-4 text-purple-600" />
          </div>

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : data && data.recentIndents.length > 0 ? (
            <div className="flex flex-col divide-y divide-border">
              {data.recentIndents.slice(0, 6).map((indent) => (
                <div key={indent.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">{indent.indentNumber}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {indent.status}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{indent.sourceBranch.name}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{indent.targetBranch.name}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {indent.requestedAt.slice(0, 10)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No supply chain indents recorded yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
