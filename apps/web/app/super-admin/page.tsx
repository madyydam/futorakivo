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
} from "lucide-react";
import { PERMISSIONS } from "@futora/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
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
    restaurantName: "Brew &amp; Bite Cafe",
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

  // Fetch real tenants from Cloud SaaS backend
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/v1/super-admin/tenants");
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
        const resBc = await fetch("/api/v1/super-admin/broadcasts");
        if (resBc.ok) {
          const dataBc = await resBc.json();
          if (Array.isArray(dataBc) && dataBc.length > 0) {
            setBroadcasts(dataBc);
          }
        }
      } catch {
        // Keeps initial broadcasts
      }
    }
    loadData();
  }, []);

  const toggleAdminStatus = async (id: string) => {
    const admin = admins.find((a) => a.id === id);
    if (!admin) return;
    const nextStatus = admin.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );

    try {
      await fetch(`/api/v1/super-admin/tenants/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Revert if error
    }
  };

  const handlePlanChange = async (id: string, plan: "Starter" | "Growth" | "Enterprise") => {
    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, plan } : a))
    );
    if (selectedAdmin && selectedAdmin.id === id) {
      setSelectedAdmin({ ...selectedAdmin, plan });
    }

    try {
      await fetch(`/api/v1/super-admin/tenants/${id}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
    } catch {
      // Silently continue
    }
  };

  const handleExtendTrial = async (id: string, days: number) => {
    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "TRIAL" } : a))
    );
    if (selectedAdmin && selectedAdmin.id === id) {
      setSelectedAdmin({ ...selectedAdmin, status: "TRIAL" });
    }

    try {
      await fetch(`/api/v1/super-admin/tenants/${id}/extend-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
    } catch {
      // Silently continue
    }
  };

  const handleCreateOutlet = () => {
    if (!newOutletName.trim() || !newEmail.trim()) return;

    const newTenant: RestaurantAdmin = {
      id: `rest-${Date.now()}`,
      restaurantName: newOutletName.trim(),
      ownerName: newOwnerName.trim() || "Owner",
      email: newEmail.trim(),
      phone: newPhone.trim() || "+91 98000 00000",
      city: newCity,
      branchesCount: 1,
      branches: [{ id: `b-${Date.now()}`, name: "Main Outlet", address: newCity }],
      monthlyGmv: "₹0",
      monthlyOrders: 0,
      plan: newPlan,
      status: "ACTIVE",
      joinedDate: "Today",
    };

    setAdmins([newTenant, ...admins]);
    setNewOutletName("");
    setNewOwnerName("");
    setNewEmail("");
    setNewPhone("");
    setOpenNewOutletModal(false);
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
      await fetch("/api/v1/super-admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBc),
      });
    } catch {
      // Pass
    }
  };

  const handleImpersonate = (admin: RestaurantAdmin) => {
    if (typeof window !== "undefined") {
      const fullPermissions = PERMISSIONS.map((p) => p.key);
      const impersonatedUser = {
        id: "owner-" + admin.id,
        restaurantId: admin.id,
        name: admin.ownerName,
        roleId: "role-owner",
        roleName: "OWNER",
        permissions: fullPermissions,
      };
      localStorage.setItem("kivo_impersonated_user", JSON.stringify(impersonatedUser));
      localStorage.setItem("FUTORA group_demo_user", JSON.stringify(impersonatedUser));
      localStorage.setItem("FUTORA group_restaurant_name", admin.restaurantName);
      localStorage.setItem("FUTORA group_branch_name", admin.branches?.[0]?.name || "Main Outlet");
    }
    router.push("/dashboard");
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Super Admin Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-foreground text-sm sm:text-base leading-tight">
                  KIVO
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                  by FUTORA group
                </span>
              </div>
            </Link>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs">
              <ShieldCheck className="mr-1 size-3.5 inline text-emerald-500" />
              Super Admin SaaS Console
            </Badge>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenBroadcastModal(true)}
              className="h-8 text-xs gap-1.5"
            >
              <Megaphone className="size-3.5 text-primary" />
              Broadcast
            </Button>
            <Button
              size="sm"
              onClick={() => setOpenNewOutletModal(true)}
              className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
            >
              <Plus className="size-3.5" />
              Onboard Restaurant
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                Exit to POS
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex-1 w-full max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title & Platform Health Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Platform Command Center</h1>
            <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
              Centralized Cloud SaaS control: Monitor restaurant tenants, subscription licensing, hardware, and platform revenue
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-foreground">PostgreSQL Cloud:</span>
              <span className="font-semibold text-emerald-600">Connected (99.99%)</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs">
              <Wifi className="size-3.5 text-blue-500" />
              <span className="font-medium text-foreground">Offline Sync Engine:</span>
              <span className="font-semibold text-blue-600">Active</span>
            </div>
          </div>
        </div>

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

        {/* Comprehensive Tabs Navigation */}
        <Tabs defaultValue="tenants" className="w-full space-y-6">
          <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60 w-full sm:w-auto flex flex-wrap">
            <TabsTrigger value="tenants" className="gap-2 text-xs">
              <Store className="size-3.5" />
              Outlets &amp; Tenants ({filteredAdmins.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2 text-xs">
              <CreditCard className="size-3.5" />
              SaaS Plans &amp; Subscriptions
            </TabsTrigger>
            <TabsTrigger value="hardware" className="gap-2 text-xs">
              <Printer className="size-3.5" />
              Terminals &amp; Hardware
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="gap-2 text-xs">
              <Megaphone className="size-3.5" />
              Platform Announcements ({broadcasts.length})
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 text-xs">
              <ShieldCheck className="size-3.5" />
              Audit Logs &amp; Security
            </TabsTrigger>
          </TabsList>

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

                <div className="flex gap-1">
                  {(["ALL", "ACTIVE", "TRIAL", "SUSPENDED"] as const).map((s) => (
                    <Button
                      key={s}
                      variant={statusFilter === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(s)}
                      className="h-9 text-xs font-medium"
                    >
                      {s}
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
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              admin.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : admin.status === "TRIAL"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                            }`}
                          >
                            {admin.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
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

          {/* TAB 3: TERMINALS & HARDWARE MONITOR */}
          <TabsContent value="hardware" className="space-y-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Live POS Terminals &amp; Hardware Network
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time heartbeat monitoring of connected thermal printers, KDS screens, and billing machines
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                    Connected Thermal Printers
                  </CardTitle>
                  <Printer className="size-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">58 Devices</div>
                  <p className="text-xs text-muted-foreground mt-1">Direct LAN IP (9100) &amp; WebUSB</p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                    Active Kitchen Displays (KDS)
                  </CardTitle>
                  <Monitor className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">34 Screens</div>
                  <p className="text-xs text-muted-foreground mt-1">Real-time WebSocket ticket boards</p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                    UPI Soundbox &amp; QR
                  </CardTitle>
                  <Radio className="size-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">46 Terminals</div>
                  <p className="text-xs text-muted-foreground mt-1">NPCI Dynamic QR verification</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Device Connectivity Matrix</CardTitle>
                <CardDescription className="text-xs">
                  Outlets reporting offline buffer queues or printer disconnects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="font-semibold text-foreground">Royal Spice Bistro — Connaught Place</div>
                      <div className="text-[11px] text-muted-foreground">2 POS Terminals, 1 Kitchen KDS, 2 Printers (LAN: 192.168.1.105)</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                    All Devices Online
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="font-semibold text-foreground">Brew &amp; Bite Cafe — Indiranagar</div>
                      <div className="text-[11px] text-muted-foreground">1 POS Terminal, 1 Coffee Bar KDS, 1 Thermal Printer (LAN: 192.168.1.140)</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                    All Devices Online
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-2 rounded-full bg-amber-500" />
                    <div>
                      <div className="font-semibold text-foreground">The Urban Dhaba — Sector 26</div>
                      <div className="text-[11px] text-muted-foreground">Operating in Local Offline Buffer mode (3 orders queued for cloud sync)</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-amber-600 bg-amber-500/10 border-amber-500/30">
                    Offline Outbox Buffering
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
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Platform Audit Logs &amp; Access Stream
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every Super Admin action, impersonation session, plan upgrade, and security event is immutably logged
              </p>
            </div>

            <Card className="border-border/60">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">SuperAdmin Session Login:</span>{" "}
                      <span className="text-muted-foreground">Platform operator accessed console from New Delhi (IP: 103.21.244.12)</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">10 mins ago</span>
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <LogIn className="size-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Support Impersonation:</span>{" "}
                      <span className="text-muted-foreground">Impersonated Royal Spice Bistro (ID: rest-1) for menu config assistance</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">1 hour ago</span>
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="size-4 text-purple-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Plan Upgrade:</span>{" "}
                      <span className="text-muted-foreground">The Urban Dhaba upgraded from Starter to Growth Plan (₹1,499/mo)</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">Yesterday</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="size-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Account Suspension:</span>{" "}
                      <span className="text-muted-foreground">Kolkata Roll Express suspended due to pending invoice settlement</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">3 days ago</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

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
