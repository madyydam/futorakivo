"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  QrCode,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash at Billing Counter", icon: Wallet },
  { id: "CARD", label: "Credit / Debit Cards (EDC POS)", icon: CreditCard },
  { id: "UPI", label: "BharatPe / UPI QR Code", icon: Smartphone },
  { id: "ONLINE", label: "Online Order Pay (Razorpay / PayU)", icon: QrCode },
];

interface Step7Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step7Payments({ data, onChange, onNext, onBack, lang }: Step7Props) {
  const t = ONBOARDING_I18N[lang].step7;
  const common = ONBOARDING_I18N[lang];

  const methods: string[] = data.methods ?? ["CASH", "CARD", "UPI"];
  const upiVpa = data.upiVpa ?? "kivo.dining@icici";
  const merchantName = data.merchantName ?? "KIVO BISTRO & LOUNGE";

  const toggleMethod = (methodId: string) => {
    const exists = methods.includes(methodId);
    const updated = exists
      ? methods.filter((m) => m !== methodId)
      : [...methods, methodId];
    onChange({ methods: updated });
  };

  const sampleUpiPayload = `upi://pay?pa=${encodeURIComponent(
    upiVpa,
  )}&pn=${encodeURIComponent(merchantName)}&cu=INR`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <QrCode className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      <div className="space-y-4">
        {/* Payment Channels Grid */}
        <div>
          <Label className="text-xs font-semibold">{t.modesLabel}</Label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 mt-1.5">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon;
              const active = methods.includes(pm.id);
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => toggleMethod(pm.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border/80 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4" />
                    <span className="text-xs">{pm.label}</span>
                  </div>
                  {active && <CheckCircle2 className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* UPI Merchant Configuration Card */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Smartphone className="size-4 text-primary" />
              {t.upiHeading}
            </h3>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              0% UPI MDR Compliant
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vpa" className="text-xs font-semibold">
                {t.vpaLabel}
              </Label>
              <Input
                id="vpa"
                value={upiVpa}
                onChange={(e) => onChange({ upiVpa: e.target.value.toLowerCase() })}
                placeholder={t.vpaPlaceholder}
                className="mt-1 h-11 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <Label htmlFor="merchantName" className="text-xs font-semibold">
                {t.merchantNameLabel}
              </Label>
              <Input
                id="merchantName"
                value={merchantName}
                onChange={(e) => onChange({ merchantName: e.target.value.toUpperCase() })}
                placeholder={t.merchantNamePlaceholder}
                className="mt-1 h-11 text-xs uppercase font-medium"
              />
            </div>
          </div>

          {/* Dynamic QR Preview */}
          <div className="rounded-xl border border-border/60 bg-background p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2.5 rounded-xl border border-border bg-white shadow-xs">
              <QRCodeSVG value={sampleUpiPayload} size={110} />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-foreground">
                Live Dynamic UPI QR Preview
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {upiVpa}
              </p>
              <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1 justify-center sm:justify-start">
                <ShieldCheck className="size-3 text-emerald-500" />
                Auto-generates NPCI standard UPI intents on bill receipts
              </p>
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
        <Button
          type="button"
          onClick={onNext}
          className="h-11 px-6 font-semibold gap-2"
        >
          {common.next}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
