"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Database,
  ExternalLink,
  Flame,
  Globe,
  HardDrive,
  Layers,
  LogIn,
  Megaphone,
  Monitor,
  Phone,
  Plus,
  Power,
  Printer,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Wifi,
  XCircle,
  Menu,
  Copy,
  Share2,
  KeyRound,
} from "lucide-react";
import { PERMISSIONS } from "@futora/types";
import { toast } from "@/lib/toast";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BranchInfo {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
}

interface RestaurantAdmin {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  branchesCount: number;
  branches?: BranchInfo[];
  monthlyGmv: string;
  monthlyOrders: number;
  plan: "Starter" | "Growth" | "Enterprise";
  status: "ACTIVE" | "TRIAL" | "SUSPENDED" | "PENDING_APPROVAL" | "APPROVED";
  activationCode?: string | null;
  isActivated?: boolean;
  activatedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  billingCycle?: string;
  utrNumber?: string | null;
  trialEndsAt?: string | null;
  maxBranches?: number;
  currency?: string;
  upiVpa?: string;
  joinedDate: string;
}

interface PlatformBroadcast {
  id: string;
  title: string;
  message: string;
  level: "INFO" | "WARNING" | "CRITICAL";
  createdAt: string;
  active: boolean;
}

const INITIAL_ADMINS: RestaurantAdmin[] = [
  {
    id: "rest-1",
    restaurantName: "Royal Spice Bistro",
    ownerName: "Rahul Sharma",
    email: "rahul@royalspice.in",
    phone: "+91 98112 34567",
    city: "New Delhi",
    branchesCount: 3,
    branches: [
      { id: "b1", name: "Connaught Place Flagship", address: "Inner Circle, CP, New Delhi", gstNumber: "07AAACR1234M1Z5" },
      { id: "b2", name: "Cyber Hub Branch", address: "DLF Cyber Hub, Gurugram", gstNumber: "06AAACR1234M1Z2" },
      { id: "b3", name: "Noida Sector 18", address: "Wave Mall, Noida", gstNumber: "09AAACR1234M1Z8" },
    ],
    monthlyGmv: "₹18,40,000",
    monthlyOrders: 4200,
    plan: "Enterprise",
    status: "ACTIVE",
    upiVpa: "royalspice@icici",
    joinedDate: "12 Oct 2025",
  },
  {
    id: "rest-2",
    restaurantName: "The Urban Dhaba",
    ownerName: "Jaspreet Singh",
    email: "jaspreet@urbandhaba.com",
    phone: "+91 98765 12340",
    city: "Chandigarh",
    branchesCount: 2,
    branches: [
      { id: "b4", name: "Sector 26", address: "Madhya Marg, Chandigarh", gstNumber: "04AABCT9988P1Z0" },
      { id: "b5", name: "Mohali Phase 7", address: "Phase 7 Market, Mohali", gstNumber: "03AABCT9988P1Z3" },
    ],
    monthlyGmv: "₹11,20,000",
    monthlyOrders: 2850,
    plan: "Growth",
    status: "ACTIVE",
    upiVpa: "urbandhaba@kotak",
    joinedDate: "05 Nov 2025",
  },
  {
    id: "rest-3",
    restaurantName: "Brew & Bite Cafe",
    ownerName: "Ananya Verma",
    email: "ananya@brewbite.in",
    phone: "+91 97410 88990",
    city: "Bengaluru",
    branchesCount: 4,
    branches: [
      { id: "b6", name: "Indiranagar 100ft Road", address: "Indiranagar, Bengaluru", gstNumber: "29AABCB5544N1Z1" },
      { id: "b7", name: "Koramangala 4th Block", address: "Koramangala, Bengaluru" },
      { id: "b8", name: "Whitefield Main", address: "ITPL Main Rd, Whitefield" },
      { id: "b9", name: "HSR Layout Sector 1", address: "27th Main, HSR Layout" },
    ],
    monthlyGmv: "₹24,80,000",
    monthlyOrders: 6100,
    plan: "Enterprise",
    status: "ACTIVE",
    upiVpa: "brewbite@hdfcbank",
    joinedDate: "20 Jan 2026",
  },
  {
    id: "rest-4",
    restaurantName: "Coastal Catch Seafood",
    ownerName: "Suresh Prabhu",
    email: "suresh@coastalcatch.com",
    phone: "+91 99201 44556",
    city: "Mumbai",
    branchesCount: 2,
    monthlyGmv: "₹14,90,000",
    monthlyOrders: 3100,
    plan: "Growth",
    status: "ACTIVE",
    upiVpa: "coastalcatch@sbi",
    joinedDate: "14 Feb 2026",
  },
  {
    id: "rest-5",
    restaurantName: "Chai Shai Bar",
    ownerName: "Rohit Deshmukh",
    email: "rohit@chaishaibar.in",
    phone: "+91 98230 77112",
    city: "Pune",
    branchesCount: 6,
    monthlyGmv: "₹31,50,000",
    monthlyOrders: 14200,
    plan: "Enterprise",
    status: "ACTIVE",
    upiVpa: "chaishai@axisbank",
    joinedDate: "02 Mar 2026",
  },
  {
    id: "rest-6",
    restaurantName: "Tandoor Tales",
    ownerName: "Vikram Malhotra",
    email: "vikram@tandoortales.com",
    phone: "+91 94401 55667",
    city: "Hyderabad",
    branchesCount: 1,
    monthlyGmv: "₹6,80,000",
    monthlyOrders: 1450,
    plan: "Starter",
    status: "TRIAL",
    upiVpa: "tandoortales@ybl",
    joinedDate: "28 Oct 2026",
  },
  {
    id: "rest-7",
    restaurantName: "Green Leaf Pure Veg",
    ownerName: "Bhavesh Patel",
    email: "bhavesh@greenleafveg.in",
    phone: "+91 98250 99881",
    city: "Ahmedabad",
    branchesCount: 2,
    monthlyGmv: "₹9,60,000",
    monthlyOrders: 2400,
    plan: "Growth",
    status: "ACTIVE",
    upiVpa: "greenleaf@barodampay",
    joinedDate: "15 Apr 2026",
  },
  {
    id: "rest-8",
    restaurantName: "Kolkata Roll Express",
    ownerName: "Sourav Ganguly",
    email: "sourav@kolkatarolls.in",
    phone: "+91 98300 22334",
    city: "Kolkata",
    branchesCount: 1,
    monthlyGmv: "₹4,20,000",
    monthlyOrders: 1100,
    plan: "Starter",
    status: "SUSPENDED",
    upiVpa: "kolkataroll@paytm",
    joinedDate: "10 Aug 2026",
  },
];

const INITIAL_BROADCASTS: PlatformBroadcast[] = [
  {
    id: "bc-1",
    title: "Scheduled Cloud DB Maintenance",
    message: "Automated indexing and database replica upgrade scheduled for Sunday 2:00 AM - 2:30 AM IST. All offline POS terminals will continue billing uninterrupted.",
    level: "INFO",
    createdAt: "Today, 10:00 AM",
    active: true,
  },
  {
    id: "bc-2",
    title: "New Feature: Wi-Fi Thermal KOT Printing",
    message: "Direct LAN 80mm/58mm thermal printer support now live for all outlets on Growth and Enterprise tiers.",
    level: "INFO",
    createdAt: "Yesterday, 04:30 PM",
    active: true,
  },
];

export default function SuperAdminPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<RestaurantAdmin[]>(INITIAL_ADMINS);
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcast[]>(INITIAL_BROADCASTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [selectedAdmin, setSelectedAdmin] = useState<RestaurantAdmin | null>(null);
  const [activeTab, setActiveTab] = useState<"tenants" | "subscriptions" | "health" | "broadcasts" | "security">("tenants");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // System Health & Audit state
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  // Authentication gate state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState("admin@futoragroup.in");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginTotp, setLoginTotp] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Modals state
  const [openNewOutletModal, setOpenNewOutletModal] = useState(false);
  const [openBroadcastModal, setOpenBroadcastModal] = useState(false);
  const [newOutletName, setNewOutletName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("Mumbai");
  const [newPlan, setNewPlan] = useState<"Starter" | "Growth" | "Enterprise">("Growth");

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastLevel, setBroadcastLevel] = useState<"INFO" | "WARNING" | "CRITICAL">("INFO");

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kivoko_super_admin_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchHealthAndAudit = async () => {
    setHealthLoading(true);
    try {
      const [hRes, aRes] = await Promise.all([
        fetch("/api/v1/super-admin/health", { headers: getAuthHeaders() }),
        fetch("/api/v1/super-admin/audit-logs", { headers: getAuthHeaders() }),
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setSystemHealth(hData);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        if (Array.isArray(aData)) setAuditLogs(aData);
      }
    } catch {
      // Offline fallback
    } finally {
      setHealthLoading(false);
    }
  };

  const loadData = async (token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch("/api/v1/super-admin/tenants", { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAdmins(data);
        }
      }
    } catch {
      // Keeps mock data if offline
    }

    try {
      const resBc = await fetch("/api/v1/super-admin/broadcasts", { headers });
      if (resBc.ok) {
        const dataBc = await resBc.json();
        if (Array.isArray(dataBc) && dataBc.length > 0) {
          setBroadcasts(dataBc);
        }
      }
    } catch {
      // Keeps initial broadcasts
    }
  };

  // Check Super Admin session on mount
  useEffect(() => {
    async function checkAuthAndLoad() {
      const token = typeof window !== "undefined" ? localStorage.getItem("kivoko_super_admin_token") : null;
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const meRes = await fetch("/api/v1/super-admin/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          setIsAuthenticated(true);
          loadData(token);
        } else {
          localStorage.removeItem("kivoko_super_admin_token");
          setIsAuthenticated(false);
        }
      } catch {
        setLoginError("Unable to reach Super Admin server to verify session.");
        setIsAuthenticated(false);
      }
    }

    checkAuthAndLoad();
  }, []);

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/v1/super-admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          totpCode: loginTotp || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message || "Invalid Super Admin credentials");
        setLoginLoading(false);
        return;
      }

      localStorage.setItem("kivoko_super_admin_token", data.accessToken);
      setIsAuthenticated(true);
      loadData(data.accessToken);
    } catch (err: any) {
      setLoginError(err.message || "Failed to reach Super Admin authentication gateway");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSuperAdminLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kivoko_super_admin_token");
    }
    setIsAuthenticated(false);
  };

  const toggleAdminStatus = async (id: string) => {
    const admin = admins.find((a) => a.id === id);
    if (!admin) return;
    const prevStatus = admin.status;
    const nextStatus = prevStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );

    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        throw new Error("Failed to update tenant status");
      }
    } catch (err: any) {
      setAdmins((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: prevStatus } : a))
      );
      toast.error(err?.message || "Could not update tenant status");
    }
  };

  const handlePlanChange = async (id: string, plan: "Starter" | "Growth" | "Enterprise") => {
    const prevAdmin = admins.find((a) => a.id === id);
    const prevPlan = prevAdmin?.plan;
    const prevSelected = selectedAdmin;

    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, plan } : a))
    );
    if (selectedAdmin && selectedAdmin.id === id) {
      setSelectedAdmin({ ...selectedAdmin, plan });
    }

    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${id}/plan`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        throw new Error("Failed to update tenant plan");
      }
    } catch (err: any) {
      if (prevPlan) {
        setAdmins((prev) =>
          prev.map((a) => (a.id === id ? { ...a, plan: prevPlan } : a))
        );
      }
      if (prevSelected && prevSelected.id === id) {
        setSelectedAdmin(prevSelected);
      }
      toast.error(err?.message || "Could not update tenant plan");
    }
  };

  const handleExtendTrial = async (id: string, days: number) => {
    const prevAdmin = admins.find((a) => a.id === id);
    const prevStatus = prevAdmin?.status;
    const prevSelected = selectedAdmin;

    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "TRIAL" } : a))
    );
    if (selectedAdmin && selectedAdmin.id === id) {
      setSelectedAdmin({ ...selectedAdmin, status: "TRIAL" });
    }

    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${id}/extend-trial`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ days }),
      });
      if (!res.ok) {
        throw new Error("Failed to extend trial");
      }
    } catch (err: any) {
      if (prevStatus) {
        setAdmins((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: prevStatus } : a))
        );
      }
      if (prevSelected && prevSelected.id === id) {
        setSelectedAdmin(prevSelected);
      }
      toast.error(err?.message || "Could not extend trial");
    }
  };

  const handleCreateOutlet = async () => {
    if (!newOutletName.trim() || !newEmail.trim()) {
      toast.error("Restaurant name and owner email are required");
      return;
    }

    try {
      const res = await fetch("/api/v1/super-admin/tenants", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          restaurantName: newOutletName.trim(),
          ownerName: newOwnerName.trim() || "Owner",
          email: newEmail.trim(),
          phone: newPhone.trim() || undefined,
          city: newCity,
          plan: newPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to provision outlet");

      toast.success("Restaurant provisioned! Awaiting payment verification & approval.");
      setAdmins([data, ...admins]);
      setNewOutletName("");
      setNewOwnerName("");
      setNewEmail("");
      setNewPhone("");
      setOpenNewOutletModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to provision outlet");
    }
  };

  const handleApproveTenant = async (adminId: string) => {
    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${adminId}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve restaurant");

      toast.success("Restaurant approved! 12-digit license code generated.");
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === adminId
            ? {
                ...a,
                status: "APPROVED",
                activationCode: data.activationCode,
                isActivated: false,
              }
            : a
        )
      );
      if (selectedAdmin && selectedAdmin.id === adminId) {
        setSelectedAdmin((prev) =>
          prev
            ? {
                ...prev,
                status: "APPROVED",
                activationCode: data.activationCode,
                isActivated: false,
              }
            : null
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve restaurant");
    }
  };

  const handleCreateBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    const newBc: PlatformBroadcast = {
      id: `bc-${Date.now()}`,
      title: broadcastTitle.trim(),
      message: broadcastMsg.trim(),
      level: broadcastLevel,
      createdAt: "Just now",
      active: true,
    };

    setBroadcasts([newBc, ...broadcasts]);
    setBroadcastTitle("");
    setBroadcastMsg("");
    setOpenBroadcastModal(false);

    try {
      const res = await fetch("/api/v1/super-admin/broadcasts", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newBc),
      });
      if (!res.ok) {
        throw new Error("Failed to dispatch platform broadcast");
      }
    } catch (err: any) {
      setBroadcasts((prev) => prev.filter((b) => b.id !== newBc.id));
      toast.error(err?.message || "Could not send broadcast");
    }
  };

  const handleImpersonate = async (admin: RestaurantAdmin) => {
    try {
      const res = await fetch(`/api/v1/super-admin/impersonate/${admin.id}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.message || "Impersonation request was rejected by server.");
        return;
      }
      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.removeItem("kivo_impersonated_user");
        localStorage.removeItem("FUTORA group_demo_user");
        localStorage.setItem("FUTORA group_restaurant_name", data.restaurantName || admin.restaurantName);
        localStorage.setItem("FUTORA group_branch_name", admin.branches?.[0]?.name || "Main Outlet");
      }
      router.push(data.redirectUrl || "/dashboard");
    } catch {
      toast.error("Failed to reach server for tenant impersonation.");
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchStatus = statusFilter === "ALL" || admin.status === statusFilter;
    const matchPlan = planFilter === "ALL" || admin.plan === planFilter;
    const matchSearch =
      admin.restaurantName.toLowerCase().includes(search.toLowerCase()) ||
      admin.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      admin.city.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPlan && matchSearch;
  });

  // Calculate live platform numbers
  const totalOutlets = admins.reduce((acc, a) => acc + (a.branchesCount || 1), 0);
  const activeCount = admins.filter((a) => a.status === "ACTIVE").length;
  const trialCount = admins.filter((a) => a.status === "TRIAL").length;
  const mrrEstimate = admins.reduce((acc, a) => {
    if (a.status !== "ACTIVE") return acc;
    if (a.plan === "Enterprise") return acc + 3999;
    if (a.plan === "Growth") return acc + 1499;
    return acc + 599;
  }, 0);

  const SuperAdminSidebar = () => (
    <div className="flex flex-col h-full bg-white dark:bg-card">
      {/* Top Brand Block */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 bg-gradient-to-r from-[#9f1239] via-[#8e1032] to-[#780c29] border-b border-[#780c29]/60 shadow-[0_4px_12px_rgba(159,18,57,0.18)]">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={28} />
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white text-sm leading-tight">
              KIVO
            </span>
            <span className="text-[10px] text-white/80 uppercase font-semibold tracking-wider">
              by FUTORA group
            </span>
          </div>
        </Link>
        <Badge variant="outline" className="border-white/30 bg-white/10 text-white font-mono text-[9px] px-1.5 py-0.5">
          SUPER ADMIN
        </Badge>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-2 tracking-wider">
          Platform SaaS Matrix
        </div>

        {[
          { id: "tenants", label: "Outlets & Tenants", icon: Store, count: filteredAdmins.length },
          { id: "subscriptions", label: "Plans & Pricing", icon: CreditCard },
          { id: "health", label: "System Health & Metrics", icon: Activity },
          { id: "broadcasts", label: "Broadcast Alerts", icon: Megaphone, count: broadcasts.length },
          { id: "security", label: "Audit Logs & Security", icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setMobileSidebarOpen(false);
              }}
              className={cn(
                "group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer",
                isActive
                  ? "bg-gradient-to-r from-[#9f1239] via-[#8e1032] to-[#780c29] text-white shadow-md font-bold"
                  : "bg-white dark:bg-card text-slate-700 dark:text-slate-300 hover:bg-muted/70 hover:text-[#9f1239] dark:hover:text-rose-400"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("size-4 shrink-0", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className={cn("text-[10px] px-1.5 py-0 font-mono", isActive ? "bg-white/20 text-white border-0" : "")}
                >
                  {item.count}
                </Badge>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-1">
          <Button
            onClick={() => {
              setOpenNewOutletModal(true);
              setMobileSidebarOpen(false);
            }}
            className="w-full text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs h-9 cursor-pointer"
          >
            <Plus className="size-3.5" />
            Onboard Restaurant
          </Button>
        </div>
      </div>

      {/* Bottom Status & Exit */}
      <div className="p-3 border-t border-border/60 bg-muted/20 space-y-2.5">
        <div className="rounded-xl border border-border/60 bg-card p-2.5 text-[11px] space-y-1">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL Cloud (99.99%)</span>
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Wifi className="size-3 text-blue-500" />
            <span>Offline Sync Engine Active</span>
          </div>
        </div>

        <Link href="/dashboard" className="block w-full">
          <Button variant="outline" className="w-full text-xs h-8 gap-1.5 cursor-pointer">
            <LogIn className="size-3 text-primary" />
            Exit to Restaurant POS
          </Button>
        </Link>

        <Button
          variant="ghost"
          onClick={handleSuperAdminLogout}
          className="w-full text-xs h-8 text-rose-500 hover:bg-rose-500/10 gap-1.5 cursor-pointer"
        >
          <Power className="size-3.5" />
          Logout Super Admin
        </Button>
      </div>
    </div>
  );

  if (isAuthenticated === false) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0C0D10] px-4 py-12 text-slate-100 select-none">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#14151B] p-8 shadow-2xl">
          <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-[#9f1239]/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-[#be123c]/20 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9f1239] to-[#881337] shadow-lg">
              <ShieldCheck className="size-7 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">KIVOKO Control Plane</h1>
            <p className="mt-1 text-xs text-slate-400">Restricted Super Admin &amp; Multi-Tenant Cockpit</p>

            {loginError && (
              <div className="mt-4 flex w-full items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <ShieldAlert className="size-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleSuperAdminLogin} className="mt-6 w-full space-y-4 text-left">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Super Admin Email</label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@futoragroup.in"
                  required
                  className="mt-1.5 bg-black/40 border-white/10 text-white text-xs h-10 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Master Password</label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="mt-1.5 bg-black/40 border-white/10 text-white text-xs h-10 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  TOTP Authenticator Code <span className="text-[10px] text-slate-500 lowercase">(optional in dev)</span>
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={loginTotp}
                  onChange={(e) => setLoginTotp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="mt-1.5 bg-black/40 border-white/10 text-white font-mono text-center tracking-widest text-sm h-10 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="mt-2 w-full h-11 bg-gradient-to-r from-[#9f1239] via-[#be123c] to-[#9f1239] text-white font-semibold text-xs rounded-xl shadow-lg hover:brightness-110 cursor-pointer"
              >
                {loginLoading ? "Authenticating..." : "Unlock Control Plane"}
              </Button>
            </form>

            <div className="mt-6 text-[10px] text-slate-500">
              Protected by Futora Zero-Trust Access Gateway · All attempts logged
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#FAF8F8] dark:bg-[#0C0D10] text-foreground">
      {/* Desktop Floating Island Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 my-3 ml-3 rounded-[24px] border border-slate-200/80 dark:border-border bg-white dark:bg-card shadow-sm flex-col h-[calc(100vh-24px)] select-none overflow-hidden z-20">
        <SuperAdminSidebar />
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 bg-white dark:bg-card p-0 flex flex-col h-full overflow-hidden border-r border-slate-200/80 dark:border-border">
          <SheetTitle className="sr-only">Super Admin Navigation</SheetTitle>
          <SuperAdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Right Main Content Pane */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        {/* Floating Top Header */}
        <header className="mt-3 mr-3 ml-3 mb-2 flex h-12 shrink-0 items-center justify-between rounded-[20px] border border-slate-200/80 dark:border-border bg-white dark:bg-card px-3.5 sm:px-5 shadow-xs z-20">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-muted/40 lg:hidden text-foreground hover:bg-muted cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {activeTab === "tenants" && "🏢 Outlets & Tenants Directory"}
                {activeTab === "subscriptions" && "💳 SaaS Plans & Pricing"}
                {activeTab === "health" && "⚡ System Health & Live Metrics"}
                {activeTab === "broadcasts" && "📢 Global Platform Broadcasts"}
                {activeTab === "security" && "🛡️ Audit Logs & Security Stream"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenBroadcastModal(true)}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <Megaphone className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Broadcast</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setOpenNewOutletModal(true)}
              className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Onboard</span>
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex cursor-pointer">
                Exit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuperAdminLogout}
              className="h-8 text-xs text-rose-500 border-rose-500/20 hover:bg-rose-500/10 gap-1.5 cursor-pointer"
            >
              <Power className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Scrollable View */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-4 py-2 pb-24 overscroll-contain space-y-5">
          {/* Platform Level KPI Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Active Restaurants
                </CardTitle>
                <Store className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{admins.length} Brands</div>
                <p className="mt-1 text-xs text-emerald-600 flex items-center">
                  <TrendingUp className="mr-1 size-3" />
                  {activeCount} Active · {trialCount} on 14-day trial
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Live Outlets
                </CardTitle>
                <Building2 className="size-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOutlets} Outlets</div>
                <p className="mt-1 text-xs text-muted-foreground">Across Indian metro markets</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Platform Monthly MRR
                </CardTitle>
                <CreditCard className="size-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">₹{mrrEstimate.toLocaleString("en-IN")}</div>
                <p className="mt-1 text-xs text-emerald-600 flex items-center">
                  <ArrowUpRight className="mr-1 size-3" />
                  Subscription SaaS revenue
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Platform 30-Day GMV
                </CardTitle>
                <Wallet className="size-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹1.28 Cr</div>
                <p className="mt-1 text-xs text-muted-foreground">Dine-in, KDS &amp; Takeaway orders</p>
              </CardContent>
            </Card>
          </div>

          {/* Controlled Tabs Content (driven by activeTab from sidebar) */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-6">
            {/* TAB 1: TENANTS & OUTLETS DIRECTORY */}
            <TabsContent value="tenants" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Restaurant Directory &amp; Licensing
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search restaurant, owner, city…"
                    className="h-9 pl-9 text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {(["ALL", "ACTIVE", "APPROVED", "PENDING_APPROVAL", "TRIAL", "SUSPENDED"] as const).map((s) => (
                    <Button
                      key={s}
                      variant={statusFilter === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(s)}
                      className="h-9 text-[11px] font-medium"
                    >
                      {s.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-1">
                  {(["ALL", "Starter", "Growth", "Enterprise"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={planFilter === p ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setPlanFilter(p)}
                      className="h-9 text-xs font-medium"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Container */}
            <Card className="border-border/60 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/60 bg-muted/40 font-medium text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Restaurant Brand</th>
                      <th className="px-4 py-3">Owner Contact</th>
                      <th className="px-4 py-3">City &amp; Outlets</th>
                      <th className="px-4 py-3">Monthly GMV</th>
                      <th className="px-4 py-3">SaaS Plan</th>
                      <th className="px-4 py-3">Licensing Status</th>
                      <th className="px-4 py-3 text-right">Super Admin Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            {admin.restaurantName}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            ID: {admin.id} · Since {admin.joinedDate}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{admin.ownerName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {admin.email} · {admin.phone}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{admin.city}</div>
                          <Badge variant="outline" className="text-[10px] mt-0.5 font-medium">
                            {admin.branchesCount} {admin.branchesCount > 1 ? "Outlets" : "Outlet"}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-foreground">{admin.monthlyGmv}</div>
                          <div className="text-[10px] text-muted-foreground font-sans">
                            {admin.monthlyOrders.toLocaleString()} orders/mo
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={`font-semibold text-[10px] ${
                              admin.plan === "Enterprise"
                                ? "bg-purple-500/15 text-purple-600 border-purple-500/30"
                                : admin.plan === "Growth"
                                ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {admin.plan}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                admin.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : admin.status === "APPROVED"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                  : admin.status === "PENDING_APPROVAL"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                  : admin.status === "TRIAL"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                              }`}
                            >
                              {admin.status === "PENDING_APPROVAL"
                                ? "Pending Payment Approval"
                                : admin.status === "APPROVED"
                                ? "Approved (Awaiting Activation)"
                                : admin.status === "ACTIVE"
                                ? "Active (Timer Live)"
                                : admin.status}
                            </Badge>
                            {admin.activationCode && admin.status === "APPROVED" && (
                              <div className="flex items-center gap-1 font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border border-border/60 text-primary font-bold">
                                <span>{admin.activationCode}</span>
                                <button
                                  type="button"
                                  title="Copy Code"
                                  onClick={() => {
                                    navigator.clipboard.writeText(admin.activationCode!);
                                    toast.success("12-digit code copied!");
                                  }}
                                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  <Copy className="size-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {admin.status === "PENDING_APPROVAL" && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveTenant(admin.id)}
                                className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Verify &amp; Approve
                              </Button>
                            )}

                            {admin.status === "APPROVED" && admin.activationCode && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const text = encodeURIComponent(
                                    `Hello ${admin.ownerName}! Your Kivoko Restaurant OS account for ${admin.restaurantName} is approved.\n\nYour 12-digit activation license code is: ${admin.activationCode}\n\nEnter this code at http://localhost:1995/activate to unlock your software. Your subscription timer will start upon activation.`
                                  );
                                  const cleanPhone = (admin.phone || "").replace(/\D/g, "");
                                  window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, "_blank");
                                }}
                                className="h-8 gap-1 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                title="Send Code to Owner on WhatsApp"
                              >
                                <Share2 className="size-3.5" />
                                WhatsApp Code
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAdmin(admin)}
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Manage
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAdminStatus(admin.id)}
                              className={`h-8 text-xs ${
                                admin.status === "ACTIVE"
                                  ? "text-rose-600 hover:bg-rose-500/10"
                                  : "text-emerald-600 hover:bg-emerald-500/10"
                              }`}
                            >
                              {admin.status === "ACTIVE" ? "Suspend" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleImpersonate(admin)}
                              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
                            >
                              <LogIn className="size-3" />
                              Impersonate
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: SAAS PLANS & PRICING ENGINE */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  SaaS Pricing Tiers &amp; License Entitlements
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure feature gates, outlet limits, and recurring pricing per restaurant
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Plan Card */}
              <Card className="border-border/60 relative">
                <CardHeader>
                  <Badge variant="outline" className="w-fit text-xs mb-1">
                    Solo Outlets
                  </Badge>
                  <CardTitle className="text-xl">Starter Plan</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono">₹599</span>
                    <span className="text-xs text-muted-foreground">/ outlet / month</span>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Ideal for small cafés, food trucks, and single-counter takeaways.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>1 POS Billing Counter Terminal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>58mm / 80mm ESC/POS Thermal Printing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Dynamic UPI QR Payments with Sound</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Offline POS Engine with Auto-Sync</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground line-through">
                      <XCircle className="size-4 text-muted-foreground/50 shrink-0" />
                      <span>Kitchen Display (KDS) Screen</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full text-xs h-9">
                    Edit Plan Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Growth Plan Card */}
              <Card className="border-primary/50 bg-primary/5 relative shadow-sm">
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader>
                  <Badge variant="outline" className="w-fit text-xs mb-1 border-primary/40 text-primary">
                    Growing Restaurants
                  </Badge>
                  <CardTitle className="text-xl">Growth Plan</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-primary">₹1,499</span>
                    <span className="text-xs text-muted-foreground">/ outlet / month</span>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Full dine-in service, visual floor map, and digital kitchen routing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Everything in Starter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Live Kitchen Display Screen (KDS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Table Floor Map &amp; QR Self-Ordering</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Recipe Costing &amp; FIFO Inventory Deduction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Up to 3 Outlets Multi-Branch Access</span>
                    </div>
                  </div>
                  <Button className="w-full text-xs h-9 font-semibold">
                    Edit Plan Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan Card */}
              <Card className="border-border/60 relative">
                <CardHeader>
                  <Badge variant="outline" className="w-fit text-xs mb-1">
                    Multi-Branch Chains
                  </Badge>
                  <CardTitle className="text-xl">Enterprise Plan</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono">₹3,999</span>
                    <span className="text-xs text-muted-foreground">/ outlet / month</span>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    For multi-city chains, central kitchens, and high-volume franchises.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Unlimited Outlets &amp; Terminals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Central Kitchen Supply &amp; Stock Indents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Zomato &amp; Swiggy Direct Kitchen Relay</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Automated WhatsApp CRM &amp; Loyalty Vouchers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Dedicated Account Manager &amp; 99.99% SLA</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full text-xs h-9">
                    Edit Plan Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: SYSTEM HEALTH & LIVE METRICS */}
          <TabsContent value="health" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  System Health &amp; Infrastructure Diagnostics
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live connection health, database query latency, and Node.js platform memory diagnostics
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthAndAudit}
                disabled={healthLoading}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${healthLoading ? "animate-spin" : ""}`} />
                <span>Refresh Diagnostics</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                    PostgreSQL Latency
                  </CardTitle>
                  <Database className="size-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">
                    {systemHealth?.database?.latencyMs !== undefined
                      ? `${systemHealth.database.latencyMs} ms`
                      : "4 ms"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connection Pool Healthy
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                    Process Memory (Heap)
                  </CardTitle>
                  <Server className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">
                    {systemHealth?.process?.memoryHeapUsedMb
                      ? `${systemHealth.process.memoryHeapUsedMb} MB`
                      : "48 MB"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    RSS: {systemHealth?.process?.memoryRssMb ? `${systemHealth.process.memoryRssMb} MB` : "112 MB"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                    Server Uptime
                  </CardTitle>
                  <Clock className="size-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">
                    {systemHealth?.process?.uptimeSeconds
                      ? `${Math.floor(systemHealth.process.uptimeSeconds / 60)} mins`
                      : "Online"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Node.js {systemHealth?.process?.nodeVersion || "v20+"}</p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                    Active Tenants
                  </CardTitle>
                  <Building2 className="size-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">
                    {systemHealth?.fleet?.activeRestaurants ?? admins.filter(a => a.status === 'ACTIVE').length} Outlets
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pending Approval: {systemHealth?.fleet?.approvedPendingActivation ?? admins.filter(a => a.status === 'PENDING_APPROVAL').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Platform Operational Status</CardTitle>
                <CardDescription className="text-xs">
                  Automated uptime status across microservices, WebSocket relay, and database nodes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="font-semibold text-foreground">PostgreSQL Multi-Tenant Cluster</div>
                      <div className="text-[11px] text-muted-foreground">Read/Write connection pool healthy. Schema in sync.</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                    Operational (100%)
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="font-semibold text-foreground">Next.js Edge Proxy &amp; API Router</div>
                      <div className="text-[11px] text-muted-foreground">Port 1995 reverse proxying /api/v1/* traffic with zero packet drops.</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                    Operational (100%)
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="font-semibold text-foreground">12-Digit License Cryptography Engine</div>
                      <div className="text-[11px] text-muted-foreground">Single-use license generator and subscription timing engine online.</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                    Secure &amp; Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: BROADCAST ANNOUNCEMENTS */}
          <TabsContent value="broadcasts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Global System Broadcasts &amp; Alerts
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Push flash banners and maintenance notices to all restaurant owner dashboards and POS terminals
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenBroadcastModal(true)}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <Plus className="size-3.5" />
                New Broadcast Alert
              </Button>
            </div>

            <div className="space-y-3">
              {broadcasts.map((bc) => (
                <Card key={bc.id} className="border-border/60">
                  <CardHeader className="py-3 px-4 flex flex-row items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          bc.level === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-600"
                            : bc.level === "WARNING"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Megaphone className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">{bc.title}</h3>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              bc.level === "CRITICAL"
                                ? "text-rose-600 border-rose-500/30"
                                : bc.level === "WARNING"
                                ? "text-amber-600 border-amber-500/30"
                                : "text-primary border-primary/30"
                            }`}
                          >
                            {bc.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                          {bc.message}
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono shrink-0">
                      {bc.createdAt}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 5: AUDIT LOGS & SECURITY */}
          <TabsContent value="security" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Platform Audit Logs &amp; Access Stream
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Every Super Admin action, impersonation session, plan upgrade, and security event is immutably logged
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthAndAudit}
                disabled={healthLoading}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${healthLoading ? "animate-spin" : ""}`} />
                <span>Refresh Audit Stream</span>
              </Button>
            </div>

            <Card className="border-border/60">
              <CardContent className="p-4 space-y-3 text-xs">
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.slice(0, 15).map((log) => (
                    <div key={log.id} className="flex items-center justify-between border-b border-border/40 pb-2.5 last:border-0">
                      <div className="flex items-center gap-2.5">
                        {log.action?.includes("LOGIN") ? (
                          <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                        ) : log.action?.includes("IMPERSONATE") ? (
                          <LogIn className="size-4 text-blue-500 shrink-0" />
                        ) : log.action?.includes("KILLSWITCH") ? (
                          <ShieldAlert className="size-4 text-rose-500 shrink-0" />
                        ) : log.action?.includes("APPROVE") ? (
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Sparkles className="size-4 text-purple-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-foreground">{log.action}:</span>{" "}
                          <span className="text-muted-foreground">
                            {log.userName || log.userEmail || "Super Admin"} · {log.metadata?.restaurantName || log.metadata?.email || log.entity || "Platform"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground">SUPER_ADMIN_LOGIN_SUCCESS:</span>{" "}
                          <span className="text-muted-foreground">Platform operator (admin@futoragroup.in) verified master credentials</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">Just now</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <LogIn className="size-4 text-blue-500 shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground">SUPER_ADMIN_IMPERSONATE:</span>{" "}
                          <span className="text-muted-foreground">Mints 15-min signed token for restaurant owner support</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">15m ago</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground">SUPER_ADMIN_APPROVE_TENANT:</span>{" "}
                          <span className="text-muted-foreground">Generated 12-digit cryptographic license code for new outlet</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">1h ago</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>

      {/* MODAL 1: TENANT DEEP DETAILS & MANAGEMENT */}
      <Dialog open={Boolean(selectedAdmin)} onOpenChange={(open) => !open && setSelectedAdmin(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <Badge variant="outline" className="text-xs">
                ID: {selectedAdmin?.id}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  selectedAdmin?.status === "ACTIVE"
                    ? "text-emerald-600 bg-emerald-500/10"
                    : selectedAdmin?.status === "TRIAL"
                    ? "text-amber-600 bg-amber-500/10"
                    : "text-rose-600 bg-rose-500/10"
                }`}
              >
                {selectedAdmin?.status}
              </Badge>
            </div>
            <DialogTitle className="text-lg font-bold">{selectedAdmin?.restaurantName}</DialogTitle>
            <DialogDescription className="text-xs">
              Registered by {selectedAdmin?.ownerName} on {selectedAdmin?.joinedDate}
            </DialogDescription>
          </DialogHeader>

          {selectedAdmin && (
            <div className="space-y-4 py-2 text-xs">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                <div>
                  <div className="text-muted-foreground text-[11px]">Primary Email</div>
                  <div className="font-medium text-foreground">{selectedAdmin.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px]">Phone Number</div>
                  <div className="font-medium text-foreground">{selectedAdmin.phone}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px]">Metro Market</div>
                  <div className="font-medium text-foreground">{selectedAdmin.city}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px]">UPI Dynamic Payee VPA</div>
                  <div className="font-medium text-foreground font-mono">{selectedAdmin.upiVpa || "Not set"}</div>
                </div>
              </div>

              {/* 12-Digit License Activation Section */}
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-primary" />
                    <span className="font-bold text-foreground text-xs">12-Digit License Key (4-4-4)</span>
                  </div>
                  {selectedAdmin.isActivated ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[10px] font-semibold">
                      Activated &bull; Timer Running
                    </Badge>
                  ) : selectedAdmin.activationCode ? (
                    <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 text-[10px] font-semibold">
                      Code Issued &bull; Timer Paused
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 text-[10px] font-semibold">
                      Pending Approval
                    </Badge>
                  )}
                </div>

                {selectedAdmin.activationCode ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                      <div className="font-mono text-base font-extrabold text-primary tracking-wider">
                        {selectedAdmin.activationCode}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedAdmin.activationCode!);
                            toast.success("12-digit code copied to clipboard!");
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <Copy className="size-3" />
                          <span>Copy</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const text = encodeURIComponent(
                              `Hello ${selectedAdmin.ownerName}! Your Kivoko Restaurant OS account for ${selectedAdmin.restaurantName} is approved.\n\nYour 12-digit activation license code is: ${selectedAdmin.activationCode}\n\nEnter this code at http://localhost:1995/activate to unlock your software. Your subscription timer will start upon activation.`
                            );
                            const cleanPhone = (selectedAdmin.phone || "").replace(/\D/g, "");
                            window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, "_blank");
                          }}
                          className="h-7 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <Share2 className="size-3" />
                          <span>WhatsApp</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {selectedAdmin.isActivated
                        ? `Subscription activated on ${selectedAdmin.activatedAt ? new Date(selectedAdmin.activatedAt).toLocaleString("en-IN") : "recently"}. Valid until ${selectedAdmin.subscriptionExpiresAt ? new Date(selectedAdmin.subscriptionExpiresAt).toLocaleDateString("en-IN") : "active"}.`
                        : "Owner must enter this code on the activation screen (/activate) to unlock POS software. Subscription timer starts only upon activation."}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Payment verification required before issuing license code.
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleApproveTenant(selectedAdmin.id)}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>Approve &amp; Generate Code</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Outlets List */}
              <div>
                <div className="font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Authorized Outlets ({selectedAdmin.branchesCount})</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Max Allowed: {selectedAdmin.plan === "Enterprise" ? "Unlimited" : selectedAdmin.plan === "Growth" ? "3" : "1"}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedAdmin.branches && selectedAdmin.branches.length > 0 ? (
                    selectedAdmin.branches.map((b) => (
                      <div key={b.id} className="rounded border border-border/40 p-2 bg-card text-[11px]">
                        <div className="font-medium text-foreground">{b.name}</div>
                        {b.address && <div className="text-muted-foreground">{b.address}</div>}
                        {b.gstNumber && <div className="text-muted-foreground font-mono">GST: {b.gstNumber}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground italic">1 Main Branch configured</div>
                  )}
                </div>
              </div>

              {/* SaaS Plan & Trial Extension Controls */}
              <div className="space-y-2 border-t border-border/60 pt-3">
                <div className="font-semibold text-foreground">SaaS Subscription &amp; Licensing</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-xs">Switch Plan:</span>
                  {(["Starter", "Growth", "Enterprise"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={selectedAdmin.plan === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePlanChange(selectedAdmin.id, p)}
                      className="h-7 text-xs"
                    >
                      {p}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-muted-foreground text-xs">Extend Trial:</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExtendTrial(selectedAdmin.id, 7)}
                    className="h-7 text-xs"
                  >
                    +7 Days
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExtendTrial(selectedAdmin.id, 14)}
                    className="h-7 text-xs"
                  >
                    +14 Days
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExtendTrial(selectedAdmin.id, 30)}
                    className="h-7 text-xs"
                  >
                    +30 Days
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center gap-2 border-t border-border/60 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedAdmin && toggleAdminStatus(selectedAdmin.id)}
              className={`h-9 text-xs ${
                selectedAdmin?.status === "ACTIVE" ? "text-rose-600 hover:bg-rose-500/10" : "text-emerald-600"
              }`}
            >
              {selectedAdmin?.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
            </Button>
            <Button
              size="sm"
              onClick={() => selectedAdmin && handleImpersonate(selectedAdmin)}
              className="h-9 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground"
            >
              <LogIn className="size-3.5" />
              Impersonate to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: ONBOARD NEW RESTAURANT */}
      <Dialog open={openNewOutletModal} onOpenChange={setOpenNewOutletModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Quick Onboard Restaurant Brand</DialogTitle>
            <DialogDescription className="text-xs">
              Provision a new multi-tenant restaurant and assign immediate SaaS licensing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-medium text-foreground block mb-1">Restaurant Brand Name *</label>
              <Input
                value={newOutletName}
                onChange={(e) => setNewOutletName(e.target.value)}
                placeholder="e.g. Copper Chimney Fine Dine"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Owner Full Name</label>
              <Input
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-foreground block mb-1">Owner Email *</label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ramesh@copperchimney.in"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1">Owner Phone</label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-foreground block mb-1">Metro City</label>
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Mumbai"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1">Initial SaaS Plan</label>
                <div className="flex gap-1">
                  {(["Starter", "Growth", "Enterprise"] as const).map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={newPlan === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewPlan(p)}
                      className="h-9 text-[11px] flex-1 px-1"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-3">
            <Button variant="outline" size="sm" onClick={() => setOpenNewOutletModal(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateOutlet} className="h-9 text-xs font-semibold bg-primary text-primary-foreground">
              Provision Outlet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: BROADCAST ANNOUNCEMENT MODAL */}
      <Dialog open={openBroadcastModal} onOpenChange={setOpenBroadcastModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">New Platform Broadcast</DialogTitle>
            <DialogDescription className="text-xs">
              Push a high-priority banner notification to all connected POS billing counters and kitchen screens
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-medium text-foreground block mb-1">Announcement Title *</label>
              <Input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Scheduled Nightly Backup &amp; Maintenance"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Severity Level</label>
              <div className="flex gap-2">
                {(["INFO", "WARNING", "CRITICAL"] as const).map((lvl) => (
                  <Button
                    key={lvl}
                    type="button"
                    variant={broadcastLevel === lvl ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBroadcastLevel(lvl)}
                    className="h-8 text-xs flex-1"
                  >
                    {lvl}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Message Body *</label>
              <Textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                rows={3}
                placeholder="Enter details of announcement or update for restaurant operators..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-3">
            <Button variant="outline" size="sm" onClick={() => setOpenBroadcastModal(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateBroadcast} className="h-9 text-xs font-semibold bg-primary text-primary-foreground">
              Dispatch to All POS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
