"use client";

import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES, LOCALE_LABELS, useI18n, type Locale } from "@/lib/i18n/context";

/** Small reusable language picker — used in the staff sidebar and on the
 * guest-facing QR ordering page. Swapping the locale only changes strings
 * already wired up to t(); everything else stays in English until it's
 * translated too (see lib/i18n/context.tsx). */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <Select value={locale} onValueChange={(v) => v && setLocale(v as Locale)}>
      <SelectTrigger
        aria-label={t("common.language")}
        className={compact ? "h-8 w-auto gap-1.5 rounded-full border border-slate-200/80 dark:border-border/80 bg-white/90 dark:bg-card/90 px-3 text-xs font-semibold shadow-2xs" : undefined}
      >
        {compact && <Languages className="h-3.5 w-3.5 text-muted-foreground" />}
        <SelectValue>{compact ? locale.toUpperCase() : LOCALE_LABELS[locale]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((code) => (
          <SelectItem key={code} value={code}>
            {LOCALE_LABELS[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
