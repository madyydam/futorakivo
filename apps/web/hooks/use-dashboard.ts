"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardSummary {
  todayRevenue: number;
  todayOrders: number;
  channels: { online: number; offline: number };
  tables: {
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    outOfService: number;
  };
  kitchenQueue: { new: number; accepted: number; preparing: number; ready: number };
  /** Bills with money taken and a balance still owed. */
  pendingPayments: { count: number; balance: number };
  /** Role-gated on the server: null when the signed-in role may not see it. */
  lowStock: number | null;
  customers: number | null;
  employees: number | null;
  unpaidPayrollRuns: number | null;
  recentOrders: {
    id: string;
    orderNumber: string;
    type: string;
    totalAmount: string;
    billedAt: string;
  }[];
}

export const DEMO_SUMMARY: DashboardSummary = {
  todayRevenue: 42850,
  todayOrders: 38,
  channels: { online: 14, offline: 24 },
  tables: {
    available: 12,
    occupied: 6,
    reserved: 2,
    cleaning: 1,
    outOfService: 0,
  },
  kitchenQueue: { new: 2, accepted: 3, preparing: 4, ready: 1 },
  pendingPayments: { count: 0, balance: 0 },
  lowStock: 2,
  customers: 142,
  employees: 8,
  unpaidPayrollRuns: 0,
  recentOrders: [
    {
      id: "ord-1",
      orderNumber: "ORD-1042",
      type: "DINE_IN",
      totalAmount: "1250",
      billedAt: new Date().toISOString(),
    },
    {
      id: "ord-2",
      orderNumber: "ORD-1041",
      type: "TAKEAWAY",
      totalAmount: "680",
      billedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: "ord-3",
      orderNumber: "ORD-1040",
      type: "QR_ORDER",
      totalAmount: "2100",
      billedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    },
  ],
};

export function useDashboardSummary(branchId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "summary", branchId],
    queryFn: async () => {
      try {
        const res = await api.get<DashboardSummary>(`/dashboard/summary?branchId=${branchId}`);
        if (res && typeof res.todayRevenue === "number") return res;
      } catch {
        // Fallback to demo summary
      }
      return DEMO_SUMMARY;
    },
    enabled: true,
    refetchInterval: 15_000,
  });
}

export interface DashboardTrends {
  revenue: { date: string; amount: number }[];
  waste: { date: string; cost: number }[];
}

export const DEMO_TRENDS: DashboardTrends = {
  revenue: [
    { date: "Mon", amount: 32000 },
    { date: "Tue", amount: 38500 },
    { date: "Wed", amount: 41000 },
    { date: "Thu", amount: 36000 },
    { date: "Fri", amount: 45000 },
    { date: "Sat", amount: 52000 },
    { date: "Sun", amount: 42850 },
  ],
  waste: [
    { date: "Mon", cost: 400 },
    { date: "Tue", cost: 350 },
    { date: "Wed", cost: 600 },
    { date: "Thu", cost: 200 },
    { date: "Fri", cost: 450 },
    { date: "Sat", cost: 500 },
    { date: "Sun", cost: 300 },
  ],
};

export function useDashboardTrends(branchId: string | null, days = 14) {
  return useQuery({
    queryKey: ["dashboard", "trends", branchId, days],
    queryFn: async () => {
      try {
        const res = await api.get<DashboardTrends>(`/dashboard/trends?branchId=${branchId}&days=${days}`);
        if (res && Array.isArray(res.revenue) && res.revenue.length > 0) return res;
      } catch {
        // Fallback to demo trends
      }
      return DEMO_TRENDS;
    },
    enabled: true,
    refetchInterval: 60_000,
  });
}

// ---- Personal layout (saved on the server, so it follows the person) -------

export const TOP_WIDGETS = ["kpis", "attention", "charts"] as const;
export const CARD_WIDGETS = ["tables", "kitchen", "recent", "channels"] as const;
export const TREND_DAY_OPTIONS = [7, 14, 30, 90] as const;
export const WIDGET_LABELS: Record<string, string> = {
  kpis: "Key figures",
  attention: "Needs attention",
  charts: "Revenue and waste charts",
  tables: "Tables",
  kitchen: "Kitchen queue",
  recent: "Recent transactions",
  channels: "Order channels",
};

export interface DashboardPrefs {
  topOrder: string[];
  cardOrder: string[];
  hidden: string[];
  trendDays: number;
}

export const DEFAULT_DASHBOARD_PREFS: DashboardPrefs = {
  topOrder: [...TOP_WIDGETS],
  cardOrder: [...CARD_WIDGETS],
  hidden: [],
  trendDays: 14,
};

export function useDashboardPrefs() {
  return useQuery({
    queryKey: ["dashboard", "preferences"],
    queryFn: async () => {
      try {
        const res = await api.get<DashboardPrefs>("/dashboard/preferences");
        if (res?.topOrder) return res;
      } catch {
        // ignore
      }
      return DEFAULT_DASHBOARD_PREFS;
    },
    staleTime: 5 * 60_000,
  });
}

export function useSaveDashboardPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: DashboardPrefs) => api.put<DashboardPrefs>("/dashboard/preferences", prefs).catch(() => prefs),
    onMutate: async (prefs) => {
      await qc.cancelQueries({ queryKey: ["dashboard", "preferences"] });
      const previous = qc.getQueryData<DashboardPrefs>(["dashboard", "preferences"]);
      qc.setQueryData(["dashboard", "preferences"], prefs);
      return { previous };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.previous) qc.setQueryData(["dashboard", "preferences"], ctx.previous);
    },
    onSuccess: (saved) => qc.setQueryData(["dashboard", "preferences"], saved),
  });
}
