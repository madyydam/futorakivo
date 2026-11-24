"use client";

import { motion } from "motion/react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  PartyPopper,
  Printer,
  QrCode,
  Receipt,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Tablet,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

interface Step11Props {
  data: Record<string, any>;
  onFinish: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  lang: Language;
}

export function Step11GoLive({
  data,
  onFinish,
  onBack,
  isSubmitting,
  lang,
}: Step11Props) {
  const t = ONBOARDING_I18N[lang].step11;
  const common = ONBOARDING_I18N[lang];

  const restaurantName = data.name || "KIVO Bistro & Lounge";
  const outletName = data.outletName || "Main Flagship Branch";
  const tableCount = data.tables?.length ?? 8;
  const menuCount = data.items?.length ?? 10;
  const staffCount = data.staff?.length ?? 3;

  return (
    <div className="space-y-6 text-center">
      {/* Celebration Header Animation */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="size-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/10"
        >
          <PartyPopper className="size-8" />
        </motion.div>

        <Badge
          variant="outline"
          className="text-xs font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/30 mb-2"
        >
          {t.readyBadge}
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          {t.description}
        </p>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-left text-xs">
        <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Store className="size-3.5 text-primary" />
            <span className="font-semibold text-[11px]">Brand</span>
          </div>
          <p className="font-bold text-foreground truncate">{restaurantName}</p>
        </div>

        <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="size-3.5 text-primary" />
            <span className="font-semibold text-[11px]">Branch</span>
          </div>
          <p className="font-bold text-foreground truncate">{outletName}</p>
        </div>

        <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileSpreadsheet className="size-3.5 text-primary" />
            <span className="font-semibold text-[11px]">Menu</span>
          </div>
          <p className="font-bold text-foreground">{menuCount} Dishes</p>
        </div>

        <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5 text-primary" />
            <span className="font-semibold text-[11px]">Floor</span>
          </div>
          <p className="font-bold text-foreground">{tableCount} Tables</p>
        </div>
      </div>

      {/* Checklist Overview */}
      <div className="rounded-xl border border-border/80 bg-card p-4 text-left text-xs space-y-2 max-w-xl mx-auto">
        <p className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider mb-2">
          Verified Core Modules
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>GST &amp; Invoicing Configured</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>Kitchen KDS &amp; ESC/POS Linked</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>Direct UPI Dynamic QR Active</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>{staffCount} Shift Staff with PINs</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>POS Device Paired &amp; Synced</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>Sandbox Test Order Validated</span>
          </div>
        </div>
      </div>

      {/* Finish CTA */}
      <div className="flex items-center justify-between max-w-xl mx-auto pt-4 border-t border-border/60">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-11 px-4 text-xs gap-1.5"
        >
          <ArrowLeft className="size-4" />
          {common.back}
        </Button>

        <Button
          type="button"
          onClick={onFinish}
          disabled={isSubmitting}
          className="h-12 px-8 font-bold text-sm gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 cursor-pointer"
        >
          <Rocket className="size-4" />
          {isSubmitting ? "Finalizing OS..." : t.launchBtn}
        </Button>
      </div>
    </div>
  );
}
