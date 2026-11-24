"use client";

import Link from "next/link";
import { CheckCircle2, Cloud, RefreshCw } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Language } from "./onboarding-translations";
import { ONBOARDING_I18N } from "./onboarding-translations";

interface OnboardingHeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  isSaving: boolean;
}

export function OnboardingHeader({
  lang,
  onLanguageChange,
  isSaving,
}: OnboardingHeaderProps) {
  const t = ONBOARDING_I18N[lang];

  return (
    <header className="border-b border-border/70 bg-card/75 backdrop-blur-md px-4 py-3 sm:px-8 sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Logo size={36} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base sm:text-lg group-hover:text-primary transition-colors">
                KIVO
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/25"
              >
                Setup Wizard
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              {t.brandSubtitle}
            </p>
          </div>
        </Link>

        {/* Right Controls: Autosave Badge & Language Toggle */}
        <div className="flex items-center gap-3">
          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 text-[11px]">
            {isSaving ? (
              <>
                <RefreshCw className="size-3 text-amber-500 animate-spin" />
                <span className="text-muted-foreground hidden sm:inline">
                  {t.saving}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span className="text-muted-foreground hidden sm:inline">
                  {t.autosaved}
                </span>
              </>
            )}
          </div>

          {/* Bilingual Switcher (EN / HI) */}
          <div className="flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onLanguageChange("en")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                lang === "en"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("hi")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                lang === "hi"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
