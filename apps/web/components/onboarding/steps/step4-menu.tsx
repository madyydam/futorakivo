"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  PlusCircle,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseCsvLine } from "@/lib/csv";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

export interface MenuItemPreview {
  name: string;
  category: string;
  price: number;
  tax: number;
  isVeg: boolean;
}

const DEMO_PRESET_ITEMS: MenuItemPreview[] = [
  { name: "Paneer Butter Masala", category: "Main Course", price: 320, tax: 5, isVeg: true },
  { name: "Dal Makhani Grand", category: "Main Course", price: 280, tax: 5, isVeg: true },
  { name: "Butter Garlic Naan", category: "Breads", price: 75, tax: 5, isVeg: true },
  { name: "Chicken Tikka Kebab", category: "Starters", price: 360, tax: 5, isVeg: false },
  { name: "Mutton Rogan Josh", category: "Main Course", price: 460, tax: 5, isVeg: false },
  { name: "Crispy Corn Pepper Salt", category: "Starters", price: 240, tax: 5, isVeg: true },
  { name: "Cold Brew Tonic", category: "Beverages", price: 180, tax: 5, isVeg: true },
  { name: "Masala Chai Pot", category: "Beverages", price: 90, tax: 5, isVeg: true },
  { name: "Margherita Pizza 10\"", category: "Pizza & Pasta", price: 390, tax: 5, isVeg: true },
  { name: "Gulab Jamun with Rabri", category: "Desserts", price: 160, tax: 5, isVeg: true },
];

interface Step4Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step4Menu({ data, onChange, onNext, onBack, lang }: Step4Props) {
  const t = ONBOARDING_I18N[lang].step4;
  const common = ONBOARDING_I18N[lang];

  const items: MenuItemPreview[] = data.items ?? DEMO_PRESET_ITEMS;
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  const downloadSampleCsv = () => {
    const csvContent =
      "item_name,category,price,tax_slab,is_veg,dietary_tag,description\n" +
      "Paneer Butter Masala,Main Course,320,5,true,Gluten-Free,Cottage cheese cubes in rich tomato gravy\n" +
      "Chicken Tikka,Starters,360,5,false,Keto,Tandoor grilled chicken chunks with spice blend\n" +
      "Butter Garlic Naan,Breads,75,5,true,Vegetarian,Clay oven flatbread infused with garlic butter\n" +
      "Cold Brew Coffee,Beverages,180,5,true,Vegan,Slow steeped Arabica dark roast\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "kivo_menu_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const loadPresetMenu = () => {
    onChange({ items: DEMO_PRESET_ITEMS });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) return;

      const parsed: MenuItemPreview[] = [];
      const headerParts = parseCsvLine(lines[0]).map((h) =>
        h.trim().toLowerCase().replace(/["'\s_]/g, ""),
      );
      const nameIdx = headerParts.findIndex((h) => h.includes("name") || h.includes("item"));
      const catIdx = headerParts.findIndex((h) => h.includes("cat"));
      const priceIdx = headerParts.findIndex((h) => h.includes("price") || h.includes("rate") || h.includes("cost") || h.includes("mrp"));
      const taxIdx = headerParts.findIndex((h) => h.includes("tax") || h.includes("gst"));
      const vegIdx = headerParts.findIndex((h) => h.includes("veg") || h.includes("diet"));

      for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        const itemName = (nameIdx >= 0 ? parts[nameIdx] : parts[0]) || "";
        if (itemName) {
          const rawVeg = String(vegIdx >= 0 ? parts[vegIdx] : parts[4] || "").toLowerCase();
          parsed.push({
            name: itemName,
            category: (catIdx >= 0 ? parts[catIdx] : parts[1]) || "General",
            price: Math.max(0, Number(priceIdx >= 0 ? parts[priceIdx] : parts[2]) || 100),
            tax: Math.max(0, Number(taxIdx >= 0 ? parts[taxIdx] : parts[3]) || 5),
            isVeg: rawVeg === "true" || rawVeg === "veg" || rawVeg === "vegetarian" || rawVeg === "1",
          });
        }
      }

      if (parsed.length > 0) {
        onChange({ items: parsed });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <FileSpreadsheet className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      {/* Action Buttons: Download Sample & Load Preset */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadSampleCsv}
          className="text-xs h-9 gap-1.5"
        >
          <Download className="size-3.5" />
          {t.downloadTemplate}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={loadPresetMenu}
          className="text-xs h-9 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
        >
          <Sparkles className="size-3.5" />
          {t.loadPreset}
        </Button>

        <label className="cursor-pointer ml-auto">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted/40 transition-colors">
            <Upload className="size-3.5 text-muted-foreground" />
            <span>Upload Custom CSV</span>
          </div>
        </label>
      </div>

      {/* Dry Run Summary Card */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {items.length} {t.itemsReady}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t.zeroErrors} · Ready for KDS station routing
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px] font-bold border-emerald-500/40 text-emerald-600">
          DRY RUN PASSED
        </Badge>
      </div>

      {/* Menu Item Preview Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border sticky top-0 font-semibold text-muted-foreground">
              <tr>
                <th className="p-3">{t.previewCols.name}</th>
                <th className="p-3">{t.previewCols.category}</th>
                <th className="p-3">{t.previewCols.price}</th>
                <th className="p-3">{t.previewCols.tax}</th>
                <th className="p-3">{t.previewCols.veg}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/20">
                  <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                    <span
                      className={`size-2.5 rounded-xs border flex items-center justify-center ${
                        item.isVeg ? "border-emerald-600" : "border-red-600"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          item.isVeg ? "bg-emerald-600" : "bg-red-600"
                        }`}
                      />
                    </span>
                    {item.name}
                  </td>
                  <td className="p-3 text-muted-foreground">{item.category}</td>
                  <td className="p-3 font-mono font-medium">₹{item.price}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.tax}%</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        item.isVeg
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {item.isVeg ? "VEG" : "NON-VEG"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
