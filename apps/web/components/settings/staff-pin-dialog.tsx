"use client";

import { KeyRound, Printer, Copy, Check, RefreshCw } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { type StaffMember } from "@/hooks/use-staff";
import { useCurrentUser } from "@/hooks/use-auth";

export function StaffPinDialog({ member }: { member: StaffMember }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedSlip, setGeneratedSlip] = useState<{
    pin: string;
    staffName: string;
    roleName: string;
    issuedAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: currentUser } = useCurrentUser();

  const generateRandomPin = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(random);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPin("");
      setGeneratedSlip(null);
      setCopied(false);
    }
    setOpen(next);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) {
      toast.error("PIN must be between 4 and 8 digits (6 digits recommended)");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put("/auth/staff-pin", {
        staffUserId: member.id,
        newPin: pin,
      });

      toast.success(`6-digit PIN successfully set for ${member.name}`);
      setGeneratedSlip({
        pin,
        staffName: member.name,
        roleName: member.role.label,
        issuedAt: new Date().toLocaleDateString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
    } catch (err: any) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update staff PIN",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSlip) return;
    navigator.clipboard.writeText(generatedSlip.pin);
    setCopied(true);
    toast.success("PIN copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Set or reset 6-digit terminal PIN"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">PIN</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        {!generatedSlip ? (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-500" />
                Terminal 6-Digit PIN: {member.name}
              </DialogTitle>
              <DialogDescription>
                Assign a numeric PIN for fast terminal authentication on POS
                devices, KDS boards, and manager approvals.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pin-input">Staff PIN</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pin-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="e.g. 583921"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-lg tracking-widest"
                  autoFocus
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPin}
                  className="shrink-0 gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                6 digits is standard. Numbers only.
              </p>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || pin.length < 4}
              >
                {isSubmitting ? "Saving…" : "Save & View Slip"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-center text-lg">
                Staff PIN Access Slip
              </DialogTitle>
              <DialogDescription className="text-center text-xs">
                ⚠️ Single-view security slip. This PIN will not be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 text-center dark:border-amber-700/60 dark:bg-amber-950/20">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Staff Member
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-foreground">
                {generatedSlip.staffName}
              </h3>
              <p className="text-xs text-muted-foreground">
                Role: {generatedSlip.roleName}
              </p>

              <div className="my-5 rounded-md bg-background/80 py-3 font-mono text-3xl font-extrabold tracking-[0.3em] text-foreground shadow-sm">
                {generatedSlip.pin}
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Use this PIN to log in on all authorized POS terminals, KDS
                screens, and register sessions. Keep your PIN confidential.
              </p>
              <p className="mt-3 text-[10px] text-muted-foreground">
                Issued: {generatedSlip.issuedAt}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy PIN"}
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Slip
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
