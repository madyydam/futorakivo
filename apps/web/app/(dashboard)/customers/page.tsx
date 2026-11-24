"use client";

import {
  Eye,
  Gift,
  Hash,
  Pencil,
  Receipt,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { CustomerHistoryModal } from "@/components/customers/customer-history-modal";
import { CustomerConsentModal } from "@/components/customers/customer-consent-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useCustomers, useDeleteCustomer, type Customer } from "@/hooks/use-customers";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function CustomersPage() {
  const { branchId } = useBranch();
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomers(branchId, search || undefined);
  const deleteCustomer = useDeleteCustomer(branchId);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [consentCustomer, setConsentCustomer] = useState<Customer | null>(null);

  const onDelete = (e: React.MouseEvent, customer: Customer) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Delete ${customer.name ?? "this customer"}? This will permanently delete their CRM profile under DPDP Act Right to Erasure.`
      )
    )
      return;
    deleteCustomer.mutate(customer.id, {
      onSuccess: () => toast.success(`${customer.name ?? "Customer"} profile erased`),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not delete customer"),
    });
  };

  const metrics = useMemo(() => {
    if (!customers) return { total: 0, returning: 0, consents: 0 };
    return {
      total: customers.length,
      returning: customers.filter((c) => (c.visitCount ?? 1) > 1).length,
      consents: customers.filter((c) => (c.consents && c.consents.length > 0) || c.phone).length,
    };
  }, [customers]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
              CRM & Guest Profiles
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
              DPDP Act 2023 Compliant
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Phone-deduplicated guest profiles, auto-captured table visits, lifetime bill history, and DPDP consent audit trail.
          </p>
        </div>
        <AddCustomerDialog branchId={branchId} />
      </div>

      {/* Metric summary badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Unique Guests</p>
            <p className="text-lg font-bold text-foreground">{metrics.total}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Returning Diners</p>
            <p className="text-lg font-bold text-foreground">{metrics.returning}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">DPDP Consents Verified</p>
            <p className="text-lg font-bold text-foreground">{metrics.consents}</p>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Main CRM Table */}
      <Card className="overflow-hidden border border-border">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Table No.</th>
                  <th className="py-3 px-4">Visits</th>
                  <th className="py-3 px-4">Total Spend</th>
                  <th className="py-3 px-4">Loyalty</th>
                  <th className="py-3 px-4 text-right">Actions & Audits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => {
                  const totalSpent =
                    c.orders?.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0) ?? 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-medium text-foreground hover:underline text-sm block"
                        >
                          {c.name ?? "Guest Diner"}
                        </Link>
                        {c.email && (
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[180px]">
                            {c.email}
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-foreground font-medium">
                        {c.phone || (
                          <span className="text-muted-foreground font-sans">No phone</span>
                        )}
                      </td>

                      {/* Auto captured Table No. */}
                      <td className="py-3.5 px-4">
                        {c.lastTableNumber ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            Table {c.lastTableNumber}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Visits Count */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            (c.visitCount ?? 1) > 2
                              ? "default"
                              : (c.visitCount ?? 1) > 1
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs tabular-nums"
                        >
                          {c.visitCount ?? 1} {(c.visitCount ?? 1) === 1 ? "visit" : "visits"}
                        </Badge>
                      </td>

                      {/* Total Spend */}
                      <td className="py-3.5 px-4 font-semibold text-foreground tabular-nums">
                        {formatCurrency(totalSpent)}
                      </td>

                      {/* Loyalty */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Star className="h-3.5 w-3.5 text-warning shrink-0" />
                          <span className="tabular-nums font-medium text-foreground">
                            {c.loyaltyPoints}
                          </span>
                          <span className="text-[10px]">pts</span>
                        </div>
                      </td>

                      {/* Actions with Eye (👁️) and Hash (#) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Eye button: Order & Bill History */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10 border-primary/20"
                            title="View Lifetime Order & Bill History (👁️)"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setHistoryCustomer(c);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Hash (#) button: DPDP Act 2023 Consent Audit */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-foreground hover:bg-muted font-bold font-mono"
                            title="View DPDP Act 2023 Consent Audit Trail (#)"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConsentCustomer(c);
                            }}
                          >
                            <Hash className="h-4 w-4" />
                          </Button>

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit customer details"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingCustomer(c);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete customer (Right to Erasure)"
                            onClick={(e) => onDelete(e, c)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground opacity-40" />
            <p className="text-base font-semibold text-foreground">No customer records yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Guests who scan table QR codes and submit their name, phone, and DPDP consent will automatically appear here with full visit tracking.
            </p>
          </div>
        )}
      </Card>

      {/* Edit Customer Dialog */}
      {editingCustomer && (
        <EditCustomerDialog
          branchId={branchId}
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {/* Eye Button Modal: Order & Bill History */}
      <CustomerHistoryModal
        branchId={branchId}
        customer={historyCustomer}
        open={!!historyCustomer}
        onOpenChange={(open) => !open && setHistoryCustomer(null)}
      />

      {/* Hash Button Modal: DPDP Act 2023 Consent Audit */}
      <CustomerConsentModal
        branchId={branchId}
        customer={consentCustomer}
        open={!!consentCustomer}
        onOpenChange={(open) => !open && setConsentCustomer(null)}
      />
    </div>
  );
}
