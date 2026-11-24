"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Radio,
  Tablet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

interface Step9Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step9Device({ data, onChange, onNext, onBack, lang }: Step9Props) {
  const t = ONBOARDING_I18N[lang].step9;
  const common = ONBOARDING_I18N[lang];

  const pairingCode = data.pairingCode ?? "KV-8429";
  const [secondsLeft, setSecondsLeft] = useState(599); // 10 minutes
  const [isPaired, setIsPaired] = useState(Boolean(data.devicePaired));

  useEffect(() => {
    if (isPaired || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaired, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const simulatePairing = () => {
    setIsPaired(true);
    onChange({ devicePaired: true, pairingCode });
  };

  const pairingPayload = JSON.stringify({
    type: "KIVO_DEVICE_PAIRING",
    code: pairingCode,
    timestamp: Date.now(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <Tablet className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      {/* Device Pairing Display Card */}
      <div className="rounded-xl border border-border/80 bg-muted/20 p-6 flex flex-col items-center text-center space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isPaired ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1.5 px-3 py-1 text-xs">
              <CheckCircle2 className="size-3.5" />
              {t.statusPaired}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/40 text-amber-500 gap-1.5 px-3 py-1 text-xs animate-pulse">
              <Radio className="size-3" />
              {t.statusListening}
            </Badge>
          )}
        </div>

        {/* Pairing Code Presentation */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t.pairingCodeLabel}</p>
          <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-primary py-1">
            {pairingCode}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>
              {t.timerLabel}: <strong className="font-mono text-foreground">{timerStr}</strong>
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
          <QRCodeSVG value={pairingPayload} size={130} />
        </div>

        {/* Action button to simulate handshake */}
        {!isPaired ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={simulatePairing}
            className="text-xs h-9 gap-1.5 font-semibold bg-background"
          >
            <Radio className="size-3 text-primary" />
            {t.simulateBtn}
          </Button>
        ) : (
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" />
            Counter POS 01 Online & Synchronized
          </p>
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
          className="h-11 px-6 font-semibold gap-2"
        >
          {common.next}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
