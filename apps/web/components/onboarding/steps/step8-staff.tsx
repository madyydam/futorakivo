"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Language } from "../onboarding-translations";
import { ONBOARDING_I18N } from "../onboarding-translations";

export interface StaffMember {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "CAPTAIN" | "WAITER" | "CASHIER" | "CHEF";
  pin: string;
}

const DEFAULT_STAFF: StaffMember[] = [
  { id: "1", name: "Vikram Malhotra (Owner)", role: "OWNER", pin: "847291" },
  { id: "2", name: "Rahul Verma", role: "CAPTAIN", pin: "492018" },
  { id: "3", name: "Sunita Rao", role: "CASHIER", pin: "318492" },
];

interface Step8Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export function Step8Staff({ data, onChange, onNext, onBack, lang }: Step8Props) {
  const t = ONBOARDING_I18N[lang].step8;
  const common = ONBOARDING_I18N[lang];

  const staffList: StaffMember[] = data.staff ?? DEFAULT_STAFF;

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<StaffMember["role"]>("WAITER");
  const [newPin, setNewPin] = useState("528401");
  const [showPins, setShowPins] = useState(false);

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPin(pin);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      pin: newPin,
    };

    onChange({ staff: [...staffList, newMember] });
    setNewName("");
    generateRandomPin();
  };

  const removeStaff = (id: string) => {
    onChange({ staff: staffList.filter((s) => s.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2.5">
          <UserCheck className="size-6 text-primary" />
          {t.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
      </div>

      {/* Staff Quick Add Card */}
      <form onSubmit={handleAddStaff} className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
        <h3 className="text-xs font-bold text-foreground">Add Team Member</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-end">
          <div className="sm:col-span-2">
            <Label className="text-[11px] font-semibold">{t.nameLabel}</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="mt-1 h-9 text-xs"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold">{t.roleLabel}</Label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium"
            >
              <option value="MANAGER">Manager</option>
              <option value="CAPTAIN">Floor Captain</option>
              <option value="WAITER">Waiter / Server</option>
              <option value="CASHIER">Billing Cashier</option>
              <option value="CHEF">Kitchen Chef</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold">{t.pinLabel}</Label>
              <button
                type="button"
                onClick={generateRandomPin}
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                <RefreshCw className="size-2.5" />
                Randomize
              </button>
            </div>
            <Input
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="mt-1 h-9 text-xs font-mono font-bold tracking-widest text-center"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" className="h-9 px-4 text-xs font-bold gap-1.5">
            <Plus className="size-3.5" />
            {t.addStaffBtn}
          </Button>
        </div>
      </form>

      {/* Roster List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">{t.activeStaffList}</Label>
          <button
            type="button"
            onClick={() => setShowPins((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showPins ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <span>{showPins ? "Hide PINs" : "Reveal PINs"}</span>
          </button>
        </div>

        <div className="rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
          {staffList.map((st) => (
            <div key={st.id} className="p-3 flex items-center justify-between hover:bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {st.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{st.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Role: <span className="font-semibold">{st.role}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-mono font-bold tracking-wider px-2 py-0.5">
                  {showPins ? st.pin : "••••••"}
                </Badge>
                {st.role !== "OWNER" && (
                  <button
                    type="button"
                    onClick={() => removeStaff(st.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
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
