"use client";

import { ArrowLeft, ArrowRight, ReceiptText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

interface Step3Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step3Taxes({ data, onChange, onNext, onBack, lang }: Step3Props) {
  const t = ONBOARDING_I18N[lang].step3;
  const common = ONBOARDING_I18N[lang];

  const gstin = data.gstin ?? "27AAAAA0000A1Z5";
  const taxMode = data.taxMode ?? "INCLUSIVE";
  const slabs: number[] = data.slabs ?? [5, 12];
  const serviceCharge = Boolean(data.serviceCharge);
  const serviceChargeRate = data.serviceChargeRate ?? 5;

  const toggleSlab = (rate: number) => {
    const exists = slabs.includes(rate);
    const updated = exists ? slabs.filter((r) => r !== rate) : [...slabs, rate].sort((a, b) => a - b);
    onChange({ slabs: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <ReceiptText className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      <div className="space-y-4">
        {/* GSTIN */}
        <div>
          <Label htmlFor="gstin" className="text-xs font-semibold">
            {t.gstinLabel}
          </Label>
          <Input
            id="gstin"
            value={gstin}
            onChange={(e) => onChange({ gstin: e.target.value.toUpperCase() })}
            placeholder={t.gstinPlaceholder}
            maxLength={15}
            className="mt-1 h-11 text-xs font-mono uppercase font-semibold tracking-wider"
          />
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <ShieldCheck className="size-3 text-emerald-500" />
            Valid 15-character GST format (State code + PAN + Entity + Z + Checksum)
          </p>
        </div>

        {/* Tax Mode: Inclusive vs Exclusive */}
        <div>
          <Label className="text-xs font-semibold">{t.taxModeLabel}</Label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 mt-1.5">
            <button
              type="button"
              onClick={() => onChange({ taxMode: "INCLUSIVE" })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                taxMode === "INCLUSIVE"
                  ? "border-primary bg-primary/10 shadow-xs"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Tax Inclusive (MRP)</span>
                {taxMode === "INCLUSIVE" && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {t.taxInclusive}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChange({ taxMode: "EXCLUSIVE" })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                taxMode === "EXCLUSIVE"
                  ? "border-primary bg-primary/10 shadow-xs"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Tax Exclusive</span>
                {taxMode === "EXCLUSIVE" && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {t.taxExclusive}
              </p>
            </button>
          </div>
        </div>

        {/* GST Slabs */}
        <div>
          <Label className="text-xs font-semibold">{t.slabsLabel}</Label>
          <div className="grid grid-cols-3 gap-2.5 mt-1.5">
            {[
              { rate: 5, label: "5% GST", sub: "2.5% CGST + 2.5% SGST (Standard Food)" },
              { rate: 12, label: "12% GST", sub: "6% CGST + 6% SGST (AC / Premium Dining)" },
              { rate: 18, label: "18% GST", sub: "9% CGST + 9% SGST (Banquet / Beverages)" },
            ].map((slab) => {
              const active = slabs.includes(slab.rate);
              return (
                <button
                  key={slab.rate}
                  type="button"
                  onClick={() => toggleSlab(slab.rate)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/80 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <div className="text-xs font-bold">{slab.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {slab.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Service Charge Switch */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-foreground">{t.serviceChargeTitle}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.serviceChargeDesc}</p>
            </div>
            <div className="flex items-center gap-3">
              {serviceCharge && (
                <div className="flex items-center gap-1 text-xs">
                  <Input
                    type="number"
                    value={serviceChargeRate}
                    onChange={(e) => onChange({ serviceChargeRate: Number(e.target.value) })}
                    className="w-16 h-8 text-xs text-center font-bold"
                    min={1}
                    max={20}
                  />
                  <span className="font-bold">%</span>
                </div>
              )}
              <Switch
                checked={serviceCharge}
                onCheckedChange={(checked) => onChange({ serviceCharge: checked })}
              />
            </div>
          </div>
        </div>
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
        <Button type="submit" className="h-11 px-6 font-semibold gap-2">
          {common.next}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
