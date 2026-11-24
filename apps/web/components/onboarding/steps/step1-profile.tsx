"use client";

import { useState } from "react";
import { ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

const CUISINES = [
  "North Indian & Mughlai",
  "South Indian Authentic",
  "Cafe, Bakery & Continental",
  "Chinese, Thai & Pan-Asian",
  "Pizzeria & Italian Trattoria",
  "Fast Casual & Street Bites",
  "Fine Dining & Multi-Cuisine",
  "Cloud Kitchen & Dark Delivery",
];

const CURRENCIES = [
  { code: "INR", label: "INR (₹) - Indian Rupee (GST Ready)" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "AED", label: "AED (د.إ) - UAE Dirham" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
];

interface Step1Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  lang: Language;
}

export function Step1Profile({ data, onChange, onNext, lang }: Step1Props) {
  const t = ONBOARDING_I18N[lang].step1;
  const common = ONBOARDING_I18N[lang];

  const name = data.name ?? "";
  const cuisine = data.cuisine ?? CUISINES[0];
  const city = data.city ?? "Mumbai";
  const currency = data.currency ?? "INR";
  const fssai = data.fssai ?? "";
  const phone = data.phone ?? "";
  const email = data.email ?? "";

  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(lang === "en" ? "Restaurant name is required." : "रेस्टोरेंट का नाम आवश्यक है।");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <Store className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor="restaurant-name" className="text-xs font-semibold">
            {t.nameLabel} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="restaurant-name"
            value={name}
            onChange={(e) => {
              onChange({ name: e.target.value });
              if (error) setError("");
            }}
            placeholder={t.namePlaceholder}
            className="mt-1 h-11 text-sm font-medium"
            required
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>

        {/* Cuisine & City */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cuisine" className="text-xs font-semibold">
              {t.cuisineLabel}
            </Label>
            <select
              id="cuisine"
              value={cuisine}
              onChange={(e) => onChange({ cuisine: e.target.value })}
              className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20"
            >
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="city" className="text-xs font-semibold">
              {t.cityLabel}
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder={t.cityPlaceholder}
              className="mt-1 h-11 text-xs"
            />
          </div>
        </div>

        {/* Currency & FSSAI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="currency" className="text-xs font-semibold">
              {t.currencyLabel}
            </Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => onChange({ currency: e.target.value })}
              className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="fssai" className="text-xs font-semibold">
              {t.fssaiLabel}
            </Label>
            <Input
              id="fssai"
              value={fssai}
              onChange={(e) => onChange({ fssai: e.target.value })}
              placeholder={t.fssaiPlaceholder}
              maxLength={14}
              className="mt-1 h-11 text-xs font-mono"
            />
          </div>
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone" className="text-xs font-semibold">
              {t.contactLabel}
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder={t.contactPlaceholder}
              className="mt-1 h-11 text-xs font-mono"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-xs font-semibold">
              {t.emailLabel}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder={t.emailPlaceholder}
              className="mt-1 h-11 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border/60">
        <Button type="submit" className="h-11 px-6 font-semibold gap-2">
          {common.next}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
