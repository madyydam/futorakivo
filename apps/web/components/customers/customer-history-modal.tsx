"use client";

import { Calendar, CreditCard, Receipt, Utensils } from "lucide-react";
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
  useCustomerHistory,
  type Customer,
  type CustomerOrderHistory,
} from "@/hooks/use-customers";
import { formatCurrency } from "@/lib/format";

interface CustomerHistoryModalProps {
  branchId: string | null;
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerHistoryModal({
  branchId,
  customer,
  open,
  onOpenChange,
}: CustomerHistoryModalProps) {
  const { data: orders, isLoading } = useCustomerHistory(
    branchId,
    customer?.id ?? null
  );

  const totalSpent = orders?.reduce(
    (sum, o) => sum + (o.status === "PAID" ? Number(o.totalAmount) : 0),
    0
  ) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Order & Billing History
              </DialogTitle>
              <DialogDescription className="mt-1">
                Lifetime dining transactions and bills for{" "}
                <span className="font-medium text-foreground">
                  {customer?.name ?? "Customer"}
                </span>{" "}
                ({customer?.phone || "No phone"})
              </DialogDescription>
            </div>
            {orders && orders.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Paid Spend</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Utensils className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No order history found</p>
              <p className="text-xs">
                This guest has not placed any recorded orders at this branch yet.
              </p>
            </div>
          ) : (
            orders.map((order: CustomerOrderHistory) => (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">
                      Order #{order.orderNumber}
                    </span>
                    <Badge variant={order.status === "PAID" ? "default" : "secondary"}>
                      {order.status}
                    </Badge>
                    {order.table && (
                      <Badge variant="outline" className="text-xs">
                        Table {order.table.number}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {/* Items breakdown */}
                <div className="rounded-lg bg-muted/40 p-3 flex flex-col gap-1.5 text-xs">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 text-foreground"
                    >
                      <div className="flex flex-col">
                        <span>
                          {item.quantity} × {item.nameSnapshot}
                        </span>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <span className="text-[11px] text-muted-foreground pl-3">
                            + {item.modifiers.map((m) => m.nameSnapshot).join(", ")}
                          </span>
                        )}
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bill totals */}
                <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Subtotal: {formatCurrency(order.subtotal)}</span>
                    {Number(order.taxAmount) > 0 && (
                      <span>· GST: {formatCurrency(order.taxAmount)}</span>
                    )}
                    {Number(order.discountAmount) > 0 && (
                      <span className="text-destructive">
                        · Discount: -{formatCurrency(order.discountAmount)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Total:</span>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Payment summary if available */}
                {order.payments && order.payments.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                    <CreditCard className="h-3 w-3" />
                    <span>
                      Paid via{" "}
                      {order.payments
                        .map((p) => `${p.method} (${formatCurrency(p.amount)})`)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
