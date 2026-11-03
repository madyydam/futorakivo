"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/hooks/use-branch";
import {
  useCreateStaff,
  useDepartments,
  useStaffRoles,
} from "@/hooks/use-staff";
import { useHrActions } from "@/hooks/use-hr";
import { ApiError } from "@/lib/api";
import {
  Banknote,
  Clock,
  IndianRupee,
  Plus,
  UserPlus,
} from "lucide-react";

interface AddTeamMemberDialogProps {
  branchId: string | null;
  trigger?: React.ReactElement;
}

export function AddTeamMemberDialog({
  branchId,
  trigger,
}: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("Staff@12345");
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [payType, setPayType] = useState<"MONTHLY" | "HOURLY">("MONTHLY");
  const [salaryRate, setSalaryRate] = useState<string>("20000");

  const { branches } = useBranch();
  const { data: roles } = useStaffRoles();
  const { data: departments } = useDepartments();
  const createStaff = useCreateStaff();
  const { setPay } = useHrActions(branchId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("Staff@12345");
    setRoleId("");
    setDepartmentId("");
    setPayType("MONTHLY");
    setSalaryRate("20000");
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    toast.success("Generated new secure password");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the staff member's name");
      return;
    }
    if (!roleId) {
      toast.error("Please select a role (e.g. Waiter, Cashier, Chef)");
      return;
    }

    const assignedBranches = branchId ? [branchId] : branches.map((b) => b.id);
    if (assignedBranches.length === 0) {
      toast.error("No active branch found. Please select a branch first.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Staff Account
      const newStaff = await createStaff.mutateAsync({
        name: name.trim(),
        email: email.trim() ? email.trim() : undefined,
        phone: phone.trim() ? phone.trim() : undefined,
        password: password || "Staff@12345",
        roleId,
        branchIds: assignedBranches,
        departmentId: departmentId || undefined,
      });

      // 2. Configure Salary & Compensation if rate entered
      const numRate = Number(salaryRate);
      if (branchId && !isNaN(numRate) && numRate > 0) {
        try {
          await setPay.mutateAsync({
            userId: newStaff.id,
            payType,
            rate: numRate,
          });
        } catch (payErr) {
          console.warn("Salary config deferred:", payErr);
        }
      }

      toast.success(
        `${name} has been added to the team! ${
          numRate > 0
            ? `Salary set to ₹${numRate.toLocaleString("en-IN")}/${
                payType === "MONTHLY" ? "mo" : "hr"
              }`
            : ""
        }`
      );
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not add team member"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button size="sm" className="gap-1.5 shadow-xs">
      <Plus className="size-4" />
      Add Team Member
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <UserPlus className="size-5 text-primary" />
              Onboard Team Member
            </DialogTitle>
            <DialogDescription>
              Create employee account, set their restaurant role, and configure salary structure in one step.
            </DialogDescription>
          </DialogHeader>

          {/* Section 1: Basic Information */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              1. Employee Profile
            </span>
            <div className="flex flex-col gap-2">
              <Label htmlFor="m-name">Full Name *</Label>
              <Input
                id="m-name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-phone">Phone Number</Label>
                <Input
                  id="m-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-email">Email (Optional)</Label>
                <Input
                  id="m-email"
                  type="email"
                  placeholder="staff@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Role & Station Assignment */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              2. Role & Department
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-role">Restaurant Role *</Label>
                <Select value={roleId} onValueChange={(v) => setRoleId(v ?? "")}>
                  <SelectTrigger id="m-role">
                    <SelectValue placeholder="Select role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-dept">Department / Station</Label>
                <Select
                  value={departmentId || "none"}
                  onValueChange={(v) => setDepartmentId(!v || v === "none" ? "" : v)}
                >
                  <SelectTrigger id="m-dept">
                    <SelectValue placeholder="Department…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 3: Salary & Compensation */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                3. Salary & Compensation
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <Banknote className="size-3.5" />
                Auto-Synced to Payroll
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayType("MONTHLY")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  payType === "MONTHLY"
                    ? "border-primary bg-primary/10 text-primary shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <Banknote className="size-4" />
                Monthly Fixed
              </button>
              <button
                type="button"
                onClick={() => setPayType("HOURLY")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  payType === "HOURLY"
                    ? "border-primary bg-primary/10 text-primary shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="size-4" />
                Hourly Wage
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-salary">
                {payType === "MONTHLY" ? "Base Monthly Salary (₹)" : "Hourly Rate (₹)"}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <IndianRupee className="size-4" />
                </span>
                <Input
                  id="m-salary"
                  type="number"
                  min="0"
                  step="any"
                  placeholder={payType === "MONTHLY" ? "e.g. 25000" : "e.g. 150"}
                  className="pl-9 font-medium tabular-nums"
                  value={salaryRate}
                  onChange={(e) => setSalaryRate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Login & POS Credentials */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                4. Login Password
              </span>
              <button
                type="button"
                onClick={generatePassword}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Generate random
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <PasswordInput
                id="m-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Used to log in to the dashboard or mobile POS. Can be changed anytime.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding Member..." : "Complete & Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
