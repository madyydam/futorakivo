"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Flame,
  Printer,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

const STATIONS = [
  { id: "hot", name: "Hot Kitchen / Curry Station", color: "text-amber-500" },
  { id: "tandoor", name: "Tandoor & Clay Oven", color: "text-orange-500" },
  { id: "bar", name: "Bar & Mocktails Counter", color: "text-blue-500" },
  { id: "bakery", name: "Dessert & Bakery Counter", color: "text-pink-500" },
];

interface Step6Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step6Kitchen({ data, onChange, onNext, onBack, lang }: Step6Props) {
  const t = ONBOARDING_I18N[lang].step6;
  const common = ONBOARDING_I18N[lang];

  const primaryStation = data.primaryStation ?? "hot";
  const printerIp = data.printerIp ?? "192.168.1.200:9100";
  const paperWidth = data.paperWidth ?? "80mm";
  const protocol = data.protocol ?? "ESC/POS Network TCP";

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestPrint = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult(t.testPrintSuccess);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <ChefHat className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      <div className="space-y-4">
        {/* Prep Stations List */}
        <div>
          <Label className="text-xs font-semibold">{t.stationsLabel}</Label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 mt-1.5">
            {STATIONS.map((st) => {
              const active = primaryStation === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onChange({ primaryStation: st.id })}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border/80 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className={`size-4 ${st.color}`} />
                    <span className="text-xs font-semibold">{st.name}</span>
                  </div>
                  {active && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      Primary
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Printer Hardware Configuration */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Printer className="size-4 text-primary" />
              {t.printerHeading}
            </h3>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              LAN / Wi-Fi Enabled
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-[11px] font-semibold">{t.protocolLabel}</Label>
              <select
                value={protocol}
                onChange={(e) => onChange({ protocol: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium"
              >
                <option value="ESC/POS Network TCP">ESC/POS Network (TCP Raw)</option>
                <option value="USB Direct Plug">USB Direct Connection</option>
                <option value="Virtual KDS Screen">Virtual Screen KDS Only</option>
              </select>
            </div>

            <div>
              <Label className="text-[11px] font-semibold">{t.ipLabel}</Label>
              <Input
                value={printerIp}
                onChange={(e) => onChange({ printerIp: e.target.value })}
                className="mt-1 h-9 text-xs font-mono font-semibold"
                placeholder="192.168.1.200:9100"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold">{t.paperLabel}</Label>
              <select
                value={paperWidth}
                onChange={(e) => onChange({ paperWidth: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium"
              >
                <option value="80mm">80mm (3-Inch Standard Receipt)</option>
                <option value="58mm">58mm (2-Inch Compact Slip)</option>
              </select>
            </div>
          </div>

          {/* Test Print Button & Feedback */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTesting}
              onClick={handleTestPrint}
              className="text-xs h-9 gap-1.5 font-semibold"
            >
              <Wifi className="size-3.5" />
              {isTesting ? "Sending Handshake..." : t.testPrintBtn}
            </Button>

            {testResult && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="size-4" />
                <span>{testResult}</span>
              </div>
            )}
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
