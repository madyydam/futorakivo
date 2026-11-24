"use client";

import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

interface Step2Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step2Outlets({ data, onChange, onNext, onBack, lang }: Step2Props) {
  const t = ONBOARDING_I18N[lang].step2;
  const common = ONBOARDING_I18N[lang];

  const outletName = data.outletName ?? "Main Flagship Outlet";
  const code = data.code ?? "FL01";
  const address = data.address ?? "Shop 12, Ground Floor, Linking Road";
  const pincode = data.pincode ?? "400050";
  const manager = data.manager ?? "Aakash Verma";
  const multiOutlet = Boolean(data.multiOutlet);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <Building2 className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      <div className="space-y-4">
        {/* Flagship Name & Internal Code */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="outletName" className="text-xs font-semibold">
              {t.outletNameLabel} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="outletName"
              value={outletName}
              onChange={(e) => onChange({ outletName: e.target.value })}
              placeholder={t.outletNamePlaceholder}
              className="mt-1 h-11 text-sm font-medium"
              required
            />
          </div>

          <div>
            <Label htmlFor="code" className="text-xs font-semibold">
              {t.codeLabel}
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
              placeholder={t.codePlaceholder}
              className="mt-1 h-11 text-xs font-mono uppercase"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="address" className="text-xs font-semibold">
            {t.addressLabel}
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder={t.addressPlaceholder}
            className="mt-1 h-11 text-xs"
          />
        </div>

        {/* Pincode & Branch Manager */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pincode" className="text-xs font-semibold">
              {t.pincodeLabel}
            </Label>
            <Input
              id="pincode"
              value={pincode}
              onChange={(e) => onChange({ pincode: e.target.value })}
              placeholder={t.pincodePlaceholder}
              maxLength={6}
              className="mt-1 h-11 text-xs font-mono"
            />
          </div>

          <div>
            <Label htmlFor="manager" className="text-xs font-semibold">
              {t.managerLabel}
            </Label>
            <Input
              id="manager"
              value={manager}
              onChange={(e) => onChange({ manager: e.target.value })}
              placeholder={t.managerPlaceholder}
              className="mt-1 h-11 text-xs"
            />
          </div>
        </div>

        {/* Multi-Outlet Architecture Toggle */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 mt-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-foreground">{t.multiOutletTitle}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.multiOutletDesc}</p>
            </div>
            <Switch
              checked={multiOutlet}
              onCheckedChange={(checked) => onChange({ multiOutlet: checked })}
            />
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
