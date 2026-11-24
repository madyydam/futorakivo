"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Flame,
  Printer,
  Receipt,
  TestTube2,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

interface Step10Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step10TestOrder({ data, onChange, onNext, onBack, lang }: Step10Props) {
  const t = ONBOARDING_I18N[lang].step10;
  const common = ONBOARDING_I18N[lang];

  const [orderStage, setOrderStage] = useState<"NEW" | "KOT_FIRED" | "BILL_GENERATED" | "SETTLED">(
    data.testOrderStage ?? "NEW"
  );

  const handleFireKot = () => {
    setOrderStage("KOT_FIRED");
    onChange({ testOrderStage: "KOT_FIRED" });
  };

  const handlePrintBill = () => {
    setOrderStage("BILL_GENERATED");
    onChange({ testOrderStage: "BILL_GENERATED" });
  };

  const handleSettle = () => {
    setOrderStage("SETTLED");
    onChange({ testOrderStage: "SETTLED" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <TestTube2 className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      {/* Simulated Live Order Card */}
      <div className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono font-bold text-xs">
              Table T-01
            </Badge>
            <span className="text-xs text-muted-foreground">Main Dining Hall</span>
          </div>

          <Badge
            className={`text-xs font-bold ${
              orderStage === "SETTLED"
                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                : orderStage === "BILL_GENERATED"
                  ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
                  : orderStage === "KOT_FIRED"
                    ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {orderStage === "SETTLED"
              ? "ORDER CLOSED (PAID)"
              : orderStage === "BILL_GENERATED"
                ? "BILL GENERATED"
                : orderStage === "KOT_FIRED"
                  ? "PREPARING IN KITCHEN"
                  : "READY TO FIRE"}
          </Badge>
        </div>

        {/* Order Items List */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-foreground">1x Paneer Butter Masala</span>
            <span className="font-mono text-muted-foreground">₹320.00</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-foreground">2x Butter Garlic Naan</span>
            <span className="font-mono text-muted-foreground">₹150.00</span>
          </div>

          <div className="border-t border-border/60 pt-2 space-y-1 text-[11px] text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">₹470.00</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%):</span>
              <span className="font-mono">₹23.50</span>
            </div>
            <div className="flex justify-between font-bold text-xs text-foreground pt-1">
              <span>Grand Total:</span>
              <span className="font-mono text-primary">₹493.50</span>
            </div>
          </div>
        </div>

        {/* Interactive Step Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <Button
            type="button"
            variant={orderStage === "NEW" ? "default" : "outline"}
            disabled={orderStage !== "NEW"}
            onClick={handleFireKot}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <Flame className="size-3.5" />
            {t.fireKotBtn}
          </Button>

          <Button
            type="button"
            variant={orderStage === "KOT_FIRED" ? "default" : "outline"}
            disabled={orderStage !== "KOT_FIRED"}
            onClick={handlePrintBill}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <Receipt className="size-3.5" />
            {t.printBillBtn}
          </Button>

          <Button
            type="button"
            variant={orderStage === "BILL_GENERATED" ? "default" : "outline"}
            disabled={orderStage !== "BILL_GENERATED"}
            onClick={handleSettle}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <Wallet className="size-3.5" />
            {t.settleOrderBtn}
          </Button>
        </div>

        {/* Success Banner */}
        {orderStage === "SETTLED" && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2.5 text-xs font-semibold text-emerald-600 animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{t.orderSuccess}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-4 gap-1.5"
        >
          <ArrowLeft className="size-4" />
          {common.back}
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={orderStage !== "SETTLED"}
          className="h-11 px-6 font-semibold gap-2"
        >
          {common.next}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
