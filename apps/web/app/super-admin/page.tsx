"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Database,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  LogIn,
  Power,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface RestaurantAdmin {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  branchesCount: number;
  monthlyGmv: string;
  monthlyOrders: number;
  plan: "Starter" | "Growth" | "Enterprise";
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  joinedDate: string;
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
    monthlyGmv: "₹18,40,000",
    monthlyOrders: 4200,
    plan: "Enterprise",
    status: "ACTIVE",
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
    monthlyGmv: "₹11,20,000",
    monthlyOrders: 2850,
    plan: "Growth",
    status: "ACTIVE",
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
    monthlyGmv: "₹24,80,000",
    monthlyOrders: 6100,
    plan: "Enterprise",
    status: "ACTIVE",
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
    joinedDate: "10 Aug 2026",
  },
];

export default function SuperAdminPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<RestaurantAdmin[]>(INITIAL_ADMINS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedAdmin, setSelectedAdmin] = useState<RestaurantAdmin | null>(null);

  const toggleAdminStatus = (id: string) => {
    setAdmins((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const nextStatus = a.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        return { ...a, status: nextStatus };
      }),
    );
  };

  const handleImpersonate = (admin: RestaurantAdmin) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("FUTORA group_restaurant_name", admin.restaurantName);
      localStorage.setItem("FUTORA group_branch_name", "Main Branch");
      const impersonatedUser = {
        id: "owner-" + admin.id,
        restaurantId: admin.id,
        name: admin.ownerName,
        roleId: "role-owner",
        roleName: "OWNER",
        permissions: ["all"],
      };
      localStorage.setItem("FUTORA group_demo_user", JSON.stringify(impersonatedUser));
    }
    router.push("/dashboard");
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchStatus = statusFilter === "ALL" || admin.status === statusFilter;
    const matchSearch =
      admin.restaurantName.toLowerCase().includes(search.toLowerCase()) ||
      admin.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      admin.city.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Super Admin Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-bold tracking-tight text-foreground text-sm sm:text-base">
                KIVO - HORECA management simplified
              </span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs">
              <ShieldCheck className="mr-1 size-3.5 inline" />
              Super Admin Console
            </Badge>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/demo">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Demo OS
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="h-8 text-xs font-semibold">
                Open Dashboard
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
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Platform Administration</h1>
            <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
              Super Admin view: Monitor all onboarded restaurant owners, multi-branch deployments, and platform GMV
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2 text-xs">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">PostgreSQL &amp; Cloud Clusters:</span>
            <span className="font-semibold text-emerald-600">Healthy (99.98% Uptime)</span>
          </div>
        </div>

        {/* Platform Level KPI Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Restaurants
              </CardTitle>
              <Store className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28 Brands</div>
              <p className="mt-1 text-xs text-emerald-600 flex items-center">
                <TrendingUp className="mr-1 size-3" />
                +4 onboarded this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Branches (Outlets)
              </CardTitle>
              <Building2 className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">46 Outlets</div>
              <p className="mt-1 text-xs text-muted-foreground">Across 8 major Indian metros</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Monthly Platform GMV
              </CardTitle>
              <Wallet className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1.21 Cr</div>
              <p className="mt-1 text-xs text-emerald-600 flex items-center">
                <ArrowUpRight className="mr-1 size-3" />
                +22% volume growth
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Monthly Orders
              </CardTitle>
              <Activity className="size-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34,250</div>
              <p className="mt-1 text-xs text-muted-foreground">Dine-in, Takeaway &amp; QR</p>
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Admins Table Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Restaurant Owners &amp; Admins Directory
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">
                {filteredAdmins.length} Admins
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
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
            </div>
          </div>

          {/* Table Container */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/60 bg-muted/40 font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Restaurant Brand</th>
                    <th className="px-4 py-3">Owner / Admin</th>
                    <th className="px-4 py-3">City &amp; Outlets</th>
                    <th className="px-4 py-3">Monthly GMV</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground text-sm">
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
                          {admin.branchesCount} {admin.branchesCount > 1 ? "Branches" : "Branch"}
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
                          className="font-semibold text-[10px]"
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
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
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
                            Details
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
        </div>
      </main>

      {/* Admin Details Modal */}
      <Dialog open={!!selectedAdmin} onOpenChange={(open) => !open && setSelectedAdmin(null)}>
        {selectedAdmin && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="size-5 text-primary" />
                {selectedAdmin.restaurantName}
              </DialogTitle>
              <DialogDescription>
                Restaurant Admin Profile &amp; Multi-Outlet Subscription
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                <div>
                  <span className="text-muted-foreground">Owner:</span>
                  <div className="font-semibold text-foreground text-sm mt-0.5">{selectedAdmin.ownerName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Metro City:</span>
                  <div className="font-semibold text-foreground text-sm mt-0.5">{selectedAdmin.city}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <div className="font-medium text-foreground mt-0.5">{selectedAdmin.email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <div className="font-medium text-foreground mt-0.5">{selectedAdmin.phone}</div>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="font-semibold text-foreground">Multi-Outlet Architecture:</div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Provisioned Branches:</span>
                  <span className="font-bold text-foreground">{selectedAdmin.branchesCount} Outlets</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Current Subscription:</span>
                  <span className="font-bold text-primary">{selectedAdmin.plan} Tier</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tenancy Model:</span>
                  <span className="font-mono text-foreground">Isolated restaurantId Schema</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleImpersonate(selectedAdmin)}
                  className="w-full gap-2 text-xs font-semibold"
                >
                  <LogIn className="size-4" />
                  Sign in as {selectedAdmin.ownerName}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

