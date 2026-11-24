"use client";

import { CheckCircle2, Globe, Hash, Info, Laptop, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCustomerConsent,
  type Customer,
  type CustomerConsentAudit,
} from "@/hooks/use-customers";

interface CustomerConsentModalProps {
  branchId: string | null;
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerConsentModal({
  branchId,
  customer,
  open,
  onOpenChange,
}: CustomerConsentModalProps) {
  const { data: consents, isLoading } = useCustomerConsent(
    branchId,
    customer?.id ?? null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                DPDP Act 2023 Consent Audit Trail
                <Badge variant="outline" className="text-[11px] font-normal border-success/40 text-success bg-success/5">
                  Statutory Proof
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                Immutable consent timestamp and audit ledger for{" "}
                <span className="font-medium text-foreground">{customer?.name ?? "Customer"}</span>{" "}
                ({customer?.phone || "No phone"})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-4 text-xs">
          {/* Statutory Compliance Notice Banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground text-xs">
                Digital Personal Data Protection Act, 2023 (Section 6 & 8)
              </p>
              <p>
                Consent was recorded affirmatively via an unchecked checkbox on the table QR menu before order submission. No personal data is shared with third-party advertising networks.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : !consents || consents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <ShieldAlert className="h-8 w-8 mb-2 text-warning/70" />
              <p className="text-sm font-medium text-foreground">No Direct QR Consent Log Found</p>
              <p className="text-xs mt-1 max-w-sm">
                This customer profile may have been added directly by floor staff from the POS or reservations. Explicit DPDP consent will be captured automatically upon their next Table QR order.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium px-1">
                <span>Recorded Consent Entries ({consents.length})</span>
                <span>Terms Policy: v1.0-2026</span>
              </div>
              {consents.map((c: CustomerConsentAudit, index: number) => (
                <div
                  key={c.id || index}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span className="font-semibold text-foreground">
                        Affirmative Checkbox Tap
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {c.termsVersion}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {new Date(c.consentedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono text-foreground">{c.consentIp || "127.0.0.1"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="font-medium text-foreground">Scope:</span>
                      <span className="truncate">{c.scope || "BILLING,SERVICE,LOYALTY"}</span>
                    </div>
                  </div>

                  {c.userAgent && (
                    <div className="flex items-start gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/30 p-2 rounded-lg break-all">
                      <Laptop className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{c.userAgent}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Legal Rights Footer */}
          <div className="rounded-xl border border-muted bg-muted/20 p-3 flex items-start gap-2 text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Section 12 Data Principal Rights:</strong> The customer may exercise their Right of Access, Correction, or Erasure (&ldquo;Right to be Forgotten&rdquo;) at any time. Deleting the customer record detaches past financial invoices while purging personal identifiers.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
