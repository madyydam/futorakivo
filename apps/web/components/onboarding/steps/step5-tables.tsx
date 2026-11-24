"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Armchair,
  Grid3X3,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

export interface DiningTable {
  id: string;
  name: string;
  section: string;
  capacity: number;
}

const DEFAULT_SECTIONS = ["Main Dining Hall", "AC Family Lounge", "Rooftop Garden", "Bar Counter"];

const INITIAL_TABLES: DiningTable[] = [
  { id: "1", name: "T-01", section: "Main Dining Hall", capacity: 4 },
  { id: "2", name: "T-02", section: "Main Dining Hall", capacity: 4 },
  { id: "3", name: "T-03", section: "Main Dining Hall", capacity: 6 },
  { id: "4", name: "T-04", section: "Main Dining Hall", capacity: 2 },
  { id: "5", name: "AC-01", section: "AC Family Lounge", capacity: 6 },
  { id: "6", name: "AC-02", section: "AC Family Lounge", capacity: 8 },
  { id: "7", name: "RT-01", section: "Rooftop Garden", capacity: 4 },
  { id: "8", name: "RT-02", section: "Rooftop Garden", capacity: 4 },
];

interface Step5Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step5Tables({ data, onChange, onNext, onBack, lang }: Step5Props) {
  const t = ONBOARDING_I18N[lang].step5;
  const common = ONBOARDING_I18N[lang];

  const tables: DiningTable[] = data.tables ?? INITIAL_TABLES;
  const sections: string[] = data.sections ?? DEFAULT_SECTIONS;

  const [selectedSection, setSelectedSection] = useState(sections[0]);
  const [prefix, setPrefix] = useState("T-");
  const [startNum, setStartNum] = useState(9);
  const [count, setCount] = useState(4);
  const [capacity, setCapacity] = useState(4);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newTables: DiningTable[] = [];
    for (let i = 0; i < count; i++) {
      const num = startNum + i;
      const formatted = num < 10 ? `0${num}` : `${num}`;
      newTables.push({
        id: `gen-${Date.now()}-${i}`,
        name: `${prefix}${formatted}`,
        section: selectedSection,
        capacity,
      });
    }
    const combined = [...tables, ...newTables];
    onChange({ tables: combined });
    setStartNum((prev) => prev + count);
  };

  const removeTable = (id: string) => {
    onChange({ tables: tables.filter((t) => t.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <Armchair className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      {/* Auto-Generator Box */}
      <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-3">
          <Grid3X3 className="size-4 text-primary" />
          {t.generatorHeading}
        </h3>

        <form onSubmit={handleGenerate} className="grid grid-cols-2 gap-3 sm:grid-cols-5 items-end">
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-[11px] font-semibold">{t.sectionSelectLabel}</Label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium"
            >
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-[11px] font-semibold">{t.prefixLabel}</Label>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="mt-1 h-9 text-xs font-mono"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold">{t.countLabel}</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1 h-9 text-xs"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold">{t.capacityLabel}</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="mt-1 h-9 text-xs"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <Button type="submit" size="sm" className="h-9 w-full font-bold text-xs gap-1">
              <Plus className="size-3.5" />
              {t.generateBtn}
            </Button>
          </div>
        </form>
      </div>

      {/* Tables Floor Plan Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">
            {t.activeTablesHeading} ({tables.length} tables active)
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 max-h-60 overflow-y-auto p-1">
          {tables.map((tbl) => (
            <div
              key={tbl.id}
              className="group relative rounded-xl border border-border bg-card p-3 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-sm font-bold text-foreground">
                  {tbl.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeTable(tbl.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  title="Remove Table"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate max-w-[90px]">{tbl.section}</span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Users className="size-3 text-primary" />
                  {tbl.capacity}
                </span>
              </div>
            </div>
          ))}
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
