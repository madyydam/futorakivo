"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CreditCard,
  Download,
  HelpCircle,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { SettingsTabs } from "@/components/settings/settings-tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";

interface PlanItem {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  maxBranches: number;
  description: string;
  features: string[];
  popular?: boolean;
}

interface SubscriptionData {
  restaurant: {
    id: string;
    name: string;
    status: string;
    plan: string;
    maxBranches: number;
    branchesUsed: number;
    trialEndsAt: string | null;
    createdAt: string;
    effectiveStatus: string;
  };
  trial: {
    isTrial: boolean;
    daysLeft: number;
    trialEndsAt: string;
    isExpired: boolean;
  };
  activeSubscription: {
    id: string;
    plan: string;
    billingCycle: "MONTHLY" | "ANNUAL";
    amount: number;
    currency: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  limits: {
    maxBranches: number;
    branchesUsed: number;
    canAddBranch: boolean;
  };
  plans: PlanItem[];
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  plan: string;
  billingCycle: string;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export default function BillingSettingsPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  // Checkout modal
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);
      const [subRes, invRes] = await Promise.all([
        api.get<SubscriptionData>("/api/v1/subscription"),
        api.get<InvoiceItem[]>("/api/v1/subscription/invoices"),
      ]);
      setData(subRes);
      setInvoices(invRes);
    } catch (err: any) {
      console.error("Failed to load billing status:", err);
      toast.error(err?.message || "Failed to load subscription information");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleOpenCheckout = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setCheckoutModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedPlan || !data) return;
    try {
      setIsProcessingPayment(true);
      const cycle = isAnnual ? "ANNUAL" : "MONTHLY";
      const baseAmount = isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice;
      const taxAmount = Math.round(baseAmount * 0.18);
      const totalAmount = baseAmount + taxAmount;

      // 1. Create order
      const orderRes = await api.post<{ orderId: string }>("/api/v1/subscription/create-order", {
        plan: selectedPlan.id,
        billingCycle: cycle,
      });

      // 2. Verify / Settle payment
      const verifyRes = await api.post<{ success: boolean; invoiceNumber: string }>(
        "/api/v1/subscription/verify-payment",
        {
          orderId: orderRes.orderId,
          paymentId: `pay_sim_${Date.now()}`,
          plan: selectedPlan.id,
          billingCycle: cycle,
          baseAmount,
          taxAmount,
          totalAmount,
        }
      );

      toast.success(
        `🎉 Upgraded to ${selectedPlan.name}! Invoice ${verifyRes.invoiceNumber} generated.`
      );
      setCheckoutModalOpen(false);
      await fetchBillingData();
    } catch (err: any) {
      console.error("Payment failed:", err);
      toast.error(err?.message || "Payment settlement failed. Please retry.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Restaurant, branch, and staff configuration</p>
        </div>
        <SettingsTabs />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { restaurant, trial, activeSubscription, limits, plans } = data;
  const isTrialActive = restaurant.status === "TRIAL" && !trial.isExpired;
  const isExpired = restaurant.effectiveStatus === "EXPIRED";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Restaurant, branch, and staff configuration</p>
      </div>

      <SettingsTabs />

      {/* Active License / Trial Alert Banner */}
      {isTrialActive && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>14-Day Free Trial Mode Active</span>
                <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px] font-mono">
                  {trial.daysLeft} DAYS REMAINING
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your full-featured trial expires on{" "}
                <span className="font-semibold text-foreground">
                  {new Date(trial.trialEndsAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                . Select a plan below to ensure uninterrupted billing and cloud sync.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenCheckout(plans.find((p) => p.id === "Growth") || plans[0])}
            className="shrink-0 bg-primary text-primary-foreground font-semibold text-xs shadow-xs"
          >
            Upgrade to Growth Plan
          </Button>
        </div>
      )}

      {isExpired && (
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-600 flex items-center gap-2">
                <span>License Trial Expired</span>
                <Badge variant="destructive" className="text-[10px] font-mono">
                  BILLING LOCKED
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your trial has concluded. Please renew or select a SaaS plan to unlock billing, KDS ticket printing, and multi-terminal sync.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenCheckout(plans[0])}
            className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
          >
            Choose Plan to Unlock
          </Button>
        </div>
      )}

      {/* Plan Status & Branch Quota Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current SaaS Plan
            </CardTitle>
            <Sparkles className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span>{restaurant.plan}</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  restaurant.effectiveStatus === "ACTIVE"
                    ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                    : restaurant.effectiveStatus === "TRIAL"
                    ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                    : "border-rose-500/40 text-rose-600 bg-rose-500/10"
                }`}
              >
                {restaurant.effectiveStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeSubscription
                ? `Auto-renews on ${new Date(activeSubscription.currentPeriodEnd).toLocaleDateString("en-IN")}`
                : "Free Trial Tier (Petpooja Cloud Architecture)"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Multi-Branch License
            </CardTitle>
            <Store className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {limits.branchesUsed} / {restaurant.plan === "Enterprise" ? "∞" : limits.maxBranches}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {limits.canAddBranch
                ? `${limits.maxBranches - limits.branchesUsed} additional branch license available`
                : "All branch slots in current plan utilized"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cloud POS Infrastructure
            </CardTitle>
            <ShieldCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
              <span>99.99%</span>
              <span className="text-xs text-muted-foreground font-normal">SLA</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Automated offline sync, hotfail backups &amp; multi-counter support
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Tier Selector with Annual Discount Toggle */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Petpooja-Grade Cloud SaaS Subscriptions
            </h2>
            <p className="text-xs text-muted-foreground">
              Scale your restaurant brand seamlessly from a single bistro counter to a 50+ outlet franchise chain.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-muted/60 p-1.5 rounded-xl border border-border/60 self-start sm:self-auto">
            <span
              className={`text-xs font-semibold cursor-pointer ${
                !isAnnual ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setIsAnnual(false)}
            >
              Billed Monthly
            </span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <span
              className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                isAnnual ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setIsAnnual(true)}
            >
              <span>Billed Annually</span>
              <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 border-0">
                2 MONTHS FREE
              </Badge>
            </span>
          </div>
        </div>

        {/* 3 Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isCurrentPlan = restaurant.plan === p.id && restaurant.effectiveStatus === "ACTIVE";
            const price = isAnnual ? Math.round(p.annualPrice / 12) : p.monthlyPrice;
            const fullPrice = isAnnual ? p.annualPrice : p.monthlyPrice;

            return (
              <Card
                key={p.id}
                className={`relative rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                  p.popular
                    ? "border-primary shadow-md bg-card ring-1 ring-primary/30"
                    : "border-border/70 shadow-xs bg-card"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#9f1239] via-[#8e1032] to-[#780c29] text-white font-bold text-[10px] px-3 py-0.5 shadow-sm">
                      MOST POPULAR FOR RESTAURANTS
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground">{p.name}</CardTitle>
                    {isCurrentPlan && (
                      <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-600 bg-emerald-500/10">
                        ACTIVE PLAN
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground min-h-[32px]">
                    {p.description}
                  </CardDescription>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>
                    {isAnnual ? (
                      <div className="text-[11px] text-emerald-600 font-medium">
                        Billed annually at ₹{fullPrice.toLocaleString("en-IN")}/yr (Save 17%)
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground">
                        Billed monthly + 18% GST
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-0">
                  <div className="space-y-2 border-t border-border/50 pt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Plan Inclusions
                    </div>
                    <ul className="space-y-1.5 text-xs text-foreground/90">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleOpenCheckout(p)}
                    disabled={isCurrentPlan}
                    className={`w-full text-xs font-bold shadow-xs cursor-pointer ${
                      isCurrentPlan
                        ? "bg-muted text-muted-foreground"
                        : p.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90"
                    }`}
                  >
                    {isCurrentPlan
                      ? "Current Active Plan"
                      : isExpired
                      ? `Re-activate on ${p.name}`
                      : `Upgrade to ${p.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tax Invoices & Payment Receipts Table */}
      <div className="space-y-3 pt-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Tax Invoices &amp; Payment Receipts
          </h2>
          <p className="text-xs text-muted-foreground">
            Official GST-compliant tax invoices for your restaurant accounts and tax filing.
          </p>
        </div>

        <Card className="border-border/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Plan / Cycle</th>
                  <th className="px-4 py-3">Base Amount</th>
                  <th className="px-4 py-3">GST (18%)</th>
                  <th className="px-4 py-3">Total Paid</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {inv.plan} ({inv.billingCycle.toLowerCase()})
                      </td>
                      <td className="px-4 py-3 font-mono">₹{inv.baseAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">₹{inv.taxAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        ₹{inv.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[10px]">
                          PAID
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.success(`Receipt ${inv.invoiceNumber} downloaded`)}
                          className="h-7 text-xs gap-1.5 text-primary hover:text-primary/80 cursor-pointer"
                        >
                          <Download className="size-3" />
                          <span>PDF</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-xs">
                      No billing invoices found. When you upgrade your plan, GST tax invoices will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* CHECKOUT MODAL: RAZORPAY / DYNAMIC UPI GATEWAY SIMULATOR */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <span>SaaS License Checkout</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm your subscription plan details and complete payment
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-3.5 py-2 text-xs">
              {/* Order Summary Box */}
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between font-bold text-sm text-foreground">
                  <span>{selectedPlan.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {isAnnual ? "Annual License" : "Monthly Billing"}
                  </Badge>
                </div>
                <div className="space-y-1 text-muted-foreground pt-1 border-t border-border/50 text-[11px]">
                  <div className="flex justify-between">
                    <span>Base Subscription Fee:</span>
                    <span className="font-mono text-foreground">
                      ₹{(isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18% Integrated Service Tax):</span>
                    <span className="font-mono text-foreground">
                      ₹{Math.round((isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice) * 0.18).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-foreground pt-1 border-t border-border/40">
                    <span>Total Payable:</span>
                    <span className="font-mono text-primary text-sm">
                      ₹{Math.round((isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice) * 1.18).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="font-bold text-foreground block">Select Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      paymentMethod === "upi"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <QrCode className="size-4" />
                    <span>Instant UPI QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <CreditCard className="size-4" />
                    <span>Card / NetBanking</span>
                  </button>
                </div>
              </div>

              {paymentMethod === "upi" ? (
                <div className="rounded-xl border border-border/60 bg-card p-3 flex items-center gap-3">
                  <div className="size-16 rounded-lg bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center">
                    <QrCode className="size-12 text-slate-900" />
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <div className="font-bold text-foreground">UPI Autopay &amp; QR</div>
                    <div className="text-muted-foreground">Scan with Google Pay, PhonePe, Paytm or BHIM</div>
                    <div className="font-mono text-[10px] text-primary">kivo.licensing@razorpay</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-card p-3 text-[11px] text-muted-foreground space-y-1">
                  <div className="font-bold text-foreground">Razorpay Secure Checkout</div>
                  <div>Supports Visa, Mastercard, RuPay, Corporate Cards and NetBanking from 50+ Indian banks.</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-border/60 pt-3 flex sm:justify-between items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessingPayment}
              onClick={() => setCheckoutModalOpen(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isProcessingPayment}
              onClick={handleProcessPayment}
              className="h-9 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer"
            >
              <Zap className="size-3.5" />
              <span>
                {isProcessingPayment
                  ? "Authorizing Payment..."
                  : `Pay & Activate ₹${
                      selectedPlan
                        ? Math.round((isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice) * 1.18).toLocaleString("en-IN")
                        : "0"
                    }`}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
