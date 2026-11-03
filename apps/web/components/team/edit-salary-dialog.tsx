"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHrActions } from "@/hooks/use-hr";
import { ApiError } from "@/lib/api";
import { Banknote, Clock, IndianRupee } from "lucide-react";

interface EditSalaryDialogProps {
  branchId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    name: string;
    roleName?: string;
  };
  initialPayType?: "MONTHLY" | "HOURLY" | null;
  initialRate?: number | null;
}

export function EditSalaryDialog({
  branchId,
  open,
  onOpenChange,
  member,
  initialPayType = "MONTHLY",
  initialRate = 0,
}: EditSalaryDialogProps) {
  const { setPay } = useHrActions(branchId);
  const [payType, setPayType] = useState<"MONTHLY" | "HOURLY">(
    initialPayType === "HOURLY" ? "HOURLY" : "MONTHLY"
  );
  const [rate, setRate] = useState<string>(
    initialRate ? String(initialRate) : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) {
      toast.error("Please select a branch first");
      return;
    }

    const numRate = Number(rate);
    if (isNaN(numRate) || numRate < 0) {
      toast.error("Please enter a valid salary rate");
      return;
    }

    setPay.mutate(
      {
        userId: member.id,
        payType,
        rate: numRate,
      },
      {
        onSuccess: () => {
          toast.success(
            `Salary updated for ${member.name}: ₹${numRate.toLocaleString("en-IN")} / ${payType === "MONTHLY" ? "month" : "hour"}`
          );
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError ? err.message : "Could not update salary"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Banknote className="size-5 text-primary" />
              Manage Salary & Pay Structure
            </DialogTitle>
            <DialogDescription>
              Configure compensation for{" "}
              <span className="font-semibold text-foreground">
                {member.name}
              </span>
              {member.roleName ? ` (${member.roleName})` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Pay Type Selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pay Schedule
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayType("MONTHLY")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    payType === "MONTHLY"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  <Banknote className="size-4" />
                  Monthly Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setPayType("HOURLY")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    payType === "HOURLY"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  <Clock className="size-4" />
                  Hourly Rate
                </button>
              </div>
            </div>

            {/* Salary Amount Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="salary-rate">
                {payType === "MONTHLY" ? "Monthly Salary Amount (₹)" : "Hourly Wage Rate (₹)"}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <IndianRupee className="size-4" />
                </span>
                <Input
                  id="salary-rate"
                  type="number"
                  min="0"
                  step="any"
                  placeholder={payType === "MONTHLY" ? "e.g. 25000" : "e.g. 150"}
                  className="pl-9 font-medium tabular-nums"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {payType === "MONTHLY"
                  ? "Calculates automatic monthly payroll with leave deductions and tips."
                  : "Multiplies clocked attendance hours from POS terminals and attendance logs."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={setPay.isPending}>
              {setPay.isPending ? "Saving..." : "Save Salary"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
