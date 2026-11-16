"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChefHat,
  Clock,
  Package,
  Plus,
  RefreshCw,
  Send,
  Truck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useIngredients } from "@/hooks/use-inventory";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransferView {
  branches: { id: string; name: string }[];
  history: {
    id: string;
    createdAt: string;
    fromBranchId: string;
    fromBranchName: string;
    toBranchName: string;
    ingredientName: string;
    unit: string;
    quantity: string;
    unitCost: string;
    note: string | null;
  }[];
}

interface StockIndentItem {
  id: string;
  ingredientName: string;
  unit: string;
  requestedQty: string | number;
  dispatchedQty?: string | number | null;
  receivedQty?: string | number | null;
  unitCost?: string | number | null;
  notes?: string | null;
}

interface StockIndent {
  id: string;
  indentNumber: string;
  sourceBranchId: string;
  sourceBranch: { id: string; name: string; isCentralKitchen?: boolean };
  targetBranchId: string;
  targetBranch: { id: string; name: string; isCentralKitchen?: boolean };
  status: "PENDING" | "APPROVED" | "DISPATCHED" | "RECEIVED" | "REJECTED" | "CANCELLED";
  urgency: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  requestedByName?: string;
  requestedAt: string;
  dispatchVehicle?: string | null;
  dispatchNotes?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  items: StockIndentItem[];
}

export default function TransfersPage() {
  const { branchId, branches } = useBranch();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"indents" | "direct" | "kitchens">("indents");

  // Direct transfer queries & form
  const { data: ingredients } = useIngredients(branchId);
  const { data: transferData, isLoading: isTransferLoading } = useQuery({
    queryKey: ["transfers", branchId],
    queryFn: () => api.get<TransferView>(`/inventory/transfers?branchId=${branchId}`),
    enabled: !!branchId,
  });

  // Indents query
  const { data: indents, isLoading: isIndentsLoading } = useQuery({
    queryKey: ["indents", branchId],
    queryFn: () => api.get<StockIndent[]>(`/inventory/indents`),
    refetchInterval: 15_000,
  });

  // Direct transfer state
  const [toBranchId, setTo] = useState("");
  const [ingredientId, setIngredient] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  // Create Indent modal/form state
  const [showIndentForm, setShowIndentForm] = useState(false);
  const [indentTargetBranch, setIndentTargetBranch] = useState("");
  const [indentUrgency, setIndentUrgency] = useState<"NORMAL" | "HIGH" | "CRITICAL">("NORMAL");
  const [indentNote, setIndentNote] = useState("");
  const [indentItems, setIndentItems] = useState<
    { ingredientName: string; unit: string; requestedQty: string }[]
  >([{ ingredientName: "", unit: "KG", requestedQty: "10" }]);

  // Dispatch modal state
  const [dispatchIndentId, setDispatchIndentId] = useState<string | null>(null);
  const [dispatchVehicle, setDispatchVehicle] = useState("MH-12-CK-4091");
  const [dispatchNotes, setDispatchNotes] = useState("Insulated cold-chain van");

  // Receive modal state
  const [receiveIndentId, setReceiveIndentId] = useState<string | null>(null);
  const [receiveItemQtys, setReceiveItemQtys] = useState<Record<string, string>>({});

  const ingredient = ingredients?.find((i) => i.id === ingredientId);

  // Mutations
  const sendTransfer = useMutation({
    mutationFn: () =>
      api.post(`/inventory/transfers?branchId=${branchId}`, {
        toBranchId,
        ingredientId,
        quantity: Number(quantity),
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setQuantity("");
      setNote("");
      toast.success("Direct stock transferred successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Transfer failed"),
  });

  const createIndentMutation = useMutation({
    mutationFn: () =>
      api.post(`/inventory/indents`, {
        sourceBranchId: branchId,
        targetBranchId: indentTargetBranch,
        urgency: indentUrgency,
        notes: indentNote || undefined,
        items: indentItems.map((item) => ({
          ingredientName: item.ingredientName,
          unit: item.unit,
          requestedQty: Number(item.requestedQty),
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["indents"] });
      setShowIndentForm(false);
      setIndentNote("");
      setIndentItems([{ ingredientName: "", unit: "KG", requestedQty: "10" }]);
      toast.success("Stock Indent requisition submitted to Central Kitchen");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create indent"),
  });

  const approveIndentMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/inventory/indents/${id}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["indents"] });
      toast.success("Indent approved");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Approval failed"),
  });

  const dispatchIndentMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/inventory/indents/${id}/dispatch`, {
        dispatchVehicle,
        dispatchNotes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["indents"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setDispatchIndentId(null);
      toast.success("Indent dispatched & Central Kitchen inventory deducted");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Dispatch failed"),
  });

  const receiveIndentMutation = useMutation({
    mutationFn: (id: string) => {
      const target = indents?.find((i) => i.id === id);
      const items = (target?.items || []).map((i) => ({
        id: i.id,
        receivedQty: Number(receiveItemQtys[i.id] ?? i.dispatchedQty ?? i.requestedQty),
      }));
      return api.patch(`/inventory/indents/${id}/receive`, { items });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["indents"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setReceiveIndentId(null);
      toast.success("Indent stock verified and credited to outlet inventory");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Receipt failed"),
  });

  const toggleKitchenMutation = useMutation({
    mutationFn: ({ id, isCentral }: { id: string; isCentral: boolean }) =>
      api.patch(`/inventory/branches/${id}/central-kitchen`, { isCentralKitchen: isCentral }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Central Kitchen status updated");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"),
  });

  const otherBranches = (branches || []).filter((b) => b.id !== branchId);
  const selectCls = "h-9 rounded-lg border border-border bg-background px-2 text-sm";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"><Clock className="h-3 w-3" /> Indent Pending</span>;
      case "APPROVED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400"><CheckCircle2 className="h-3 w-3" /> Approved</span>;
      case "DISPATCHED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400"><Truck className="h-3 w-3" /> In Transit</span>;
      case "RECEIVED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Received</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400"><XCircle className="h-3 w-3" /> Rejected</span>;
      default:
        return <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
            Supply Chain & Central Kitchen
          </h1>
          <p className="text-sm text-muted-foreground">
            Petpooja-grade multi-branch requisition indents, commissary stock transfers, and warehouse logistics
          </p>
        </div>

        {activeTab === "indents" && (
          <Button
            onClick={() => setShowIndentForm(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Raise Stock Indent
          </Button>
        )}
      </div>

      <InventoryTabs />

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("indents")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
            activeTab === "indents"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary",
          )}
        >
          <Boxes className="h-4 w-4" />
          Stock Indents & Requisitions
          {indents && indents.filter((i) => i.status === "PENDING").length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
              {indents.filter((i) => i.status === "PENDING").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("direct")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
            activeTab === "direct"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary",
          )}
        >
          <ArrowRight className="h-4 w-4" />
          Direct Stock Transfer
        </button>

        <button
          onClick={() => setActiveTab("kitchens")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
            activeTab === "kitchens"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary",
          )}
        >
          <ChefHat className="h-4 w-4" />
          Central Kitchen Settings
        </button>
      </div>

      {/* TAB 1: STOCK INDENTS & REQUISITIONS */}
      {activeTab === "indents" && (
        <div className="flex flex-col gap-6">
          {/* Create Indent Form Modal / Card */}
          {showIndentForm && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Raise New Stock Indent</h3>
                  <p className="text-xs text-muted-foreground">
                    Request fresh ingredients or prepared batches from your Central Kitchen or parent warehouse
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowIndentForm(false)}>
                  Cancel
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Supplying Outlet (Central Kitchen / Hub)</label>
                  <select
                    className={cn(selectCls, "w-full mt-1")}
                    value={indentTargetBranch}
                    onChange={(e) => setIndentTargetBranch(e.target.value)}
                  >
                    <option value="">Select Supplying Branch / Commissary…</option>
                    {otherBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Urgency Level</label>
                  <select
                    className={cn(selectCls, "w-full mt-1")}
                    value={indentUrgency}
                    onChange={(e) => setIndentUrgency(e.target.value as any)}
                  >
                    <option value="NORMAL">Normal Restock</option>
                    <option value="HIGH">High Priority (Low Stock Warning)</option>
                    <option value="CRITICAL">Critical Stockout Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Order Requisition Note</label>
                  <Input
                    placeholder="e.g. Weekend prep stock, morning delivery requested"
                    className="mt-1"
                    value={indentNote}
                    onChange={(e) => setIndentNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Indent Items</p>
                {indentItems.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2">
                    <Input
                      placeholder="Ingredient name (e.g. Marinated Chicken, Paneer, Basmati Rice)"
                      className="min-w-[200px] flex-1"
                      value={item.ingredientName}
                      onChange={(e) => {
                        const copy = [...indentItems];
                        copy[idx].ingredientName = e.target.value;
                        setIndentItems(copy);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      className="w-28"
                      value={item.requestedQty}
                      onChange={(e) => {
                        const copy = [...indentItems];
                        copy[idx].requestedQty = e.target.value;
                        setIndentItems(copy);
                      }}
                    />
                    <select
                      className={cn(selectCls, "w-24")}
                      value={item.unit}
                      onChange={(e) => {
                        const copy = [...indentItems];
                        copy[idx].unit = e.target.value;
                        setIndentItems(copy);
                      }}
                    >
                      <option value="KG">KG</option>
                      <option value="G">G</option>
                      <option value="L">L</option>
                      <option value="ML">ML</option>
                      <option value="PIECE">PIECE</option>
                      <option value="DOZEN">DOZEN</option>
                      <option value="PACK">PACK</option>
                      <option value="BOX">BOX</option>
                    </select>

                    {indentItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-500/10"
                        onClick={() => setIndentItems(indentItems.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}

                <div className="mt-2 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setIndentItems([...indentItems, { ingredientName: "", unit: "KG", requestedQty: "5" }])
                    }
                  >
                    + Add Another Item
                  </Button>

                  <Button
                    disabled={
                      !indentTargetBranch ||
                      indentItems.some((i) => !i.ingredientName || Number(i.requestedQty) <= 0) ||
                      createIndentMutation.isPending
                    }
                    onClick={() => createIndentMutation.mutate()}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {createIndentMutation.isPending ? "Submitting…" : "Dispatch Indent to Central Kitchen"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Indent Stream Cards */}
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Active Indent Requisitions</h3>
                <p className="text-xs text-muted-foreground">
                  Track delivery progress, batch preparation, dispatch vehicles, and receiving acknowledgements
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => qc.invalidateQueries({ queryKey: ["indents"] })}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>

            {isIndentsLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : indents && indents.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {indents.map((indent) => (
                  <div key={indent.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {indent.indentNumber}
                        </span>
                        {getStatusBadge(indent.status)}
                        {indent.urgency === "CRITICAL" && (
                          <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                            CRITICAL
                          </span>
                        )}
                        {indent.urgency === "HIGH" && (
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                            HIGH
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Raised {indent.requestedAt.slice(0, 16).replace("T", " ")}
                        {indent.requestedByName ? ` by ${indent.requestedByName}` : ""}
                      </div>
                    </div>

                    {/* Route line */}
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {indent.sourceBranch.name} (Outlet)
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <ChefHat className="h-4 w-4" />
                        {indent.targetBranch.name} (Central Kitchen)
                      </span>
                      {indent.dispatchVehicle && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                          <Truck className="h-3.5 w-3.5" /> Van: {indent.dispatchVehicle}
                        </span>
                      )}
                    </div>

                    {/* Items table */}
                    <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th>Item Name</th>
                            <th>Requested</th>
                            <th>Dispatched</th>
                            <th>Received</th>
                            <th>Cost Valuation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {indent.items.map((item) => (
                            <tr key={item.id} className="border-t border-border/50">
                              <td className="py-1 font-medium">{item.ingredientName}</td>
                              <td>{Number(item.requestedQty)} {item.unit}</td>
                              <td>{item.dispatchedQty != null ? `${Number(item.dispatchedQty)} ${item.unit}` : "—"}</td>
                              <td>{item.receivedQty != null ? `${Number(item.receivedQty)} ${item.unit}` : "—"}</td>
                              <td>{item.unitCost ? formatCurrency(Number(item.unitCost)) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Workflow Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-xs text-muted-foreground">
                        {indent.notes && <span>Note: {indent.notes}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        {indent.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveIndentMutation.mutate(indent.id)}
                              disabled={approveIndentMutation.isPending}
                            >
                              Approve Indent
                            </Button>
                            <Button
                              size="sm"
                              className="bg-purple-600 text-white hover:bg-purple-700"
                              onClick={() => setDispatchIndentId(indent.id)}
                            >
                              <Truck className="mr-1.5 h-3.5 w-3.5" /> Dispatch Goods
                            </Button>
                          </>
                        )}

                        {indent.status === "APPROVED" && (
                          <Button
                            size="sm"
                            className="bg-purple-600 text-white hover:bg-purple-700"
                            onClick={() => setDispatchIndentId(indent.id)}
                          >
                            <Truck className="mr-1.5 h-3.5 w-3.5" /> Dispatch Goods
                          </Button>
                        )}

                        {indent.status === "DISPATCHED" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => {
                              setReceiveIndentId(indent.id);
                              const defaultQtys: Record<string, string> = {};
                              indent.items.forEach((i) => {
                                defaultQtys[i.id] = String(i.dispatchedQty ?? i.requestedQty);
                              });
                              setReceiveItemQtys(defaultQtys);
                            }}
                          >
                            <Package className="mr-1.5 h-3.5 w-3.5" /> Receive & Verify Goods
                          </Button>
                        )}

                        {indent.status === "RECEIVED" && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Goods stocked into outlet inventory
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No stock indents raised yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIndentForm(true)}
                  className="mt-3"
                >
                  Raise First Indent
                </Button>
              </div>
            )}
          </Card>

          {/* Dispatch Modal Dialog */}
          {dispatchIndentId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <Card className="w-full max-w-md p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-foreground">Dispatch Stock Indent</h3>
                <p className="text-xs text-muted-foreground">
                  Deduct from Central Kitchen inventory and dispatch cold-chain / van transfer
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Delivery Van / Vehicle Number</label>
                    <Input
                      value={dispatchVehicle}
                      onChange={(e) => setDispatchVehicle(e.target.value)}
                      placeholder="e.g. MH-12-CK-4091"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Driver / Dispatch Notes</label>
                    <Input
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      placeholder="e.g. Temperature maintained at 4°C"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setDispatchIndentId(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => dispatchIndentMutation.mutate(dispatchIndentId)}
                    disabled={dispatchIndentMutation.isPending}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    {dispatchIndentMutation.isPending ? "Dispatching…" : "Confirm Dispatch"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Receive & Verify Modal Dialog */}
          {receiveIndentId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <Card className="w-full max-w-lg p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-foreground">Verify & Stock Inbound Indent</h3>
                <p className="text-xs text-muted-foreground">
                  Confirm physically received quantities. Inbound items will be credited to local inventory.
                </p>

                <div className="mt-4 max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th>Ingredient</th>
                        <th>Dispatched</th>
                        <th>Received Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indents
                        ?.find((i) => i.id === receiveIndentId)
                        ?.items.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="py-2 font-medium">{item.ingredientName}</td>
                            <td>{Number(item.dispatchedQty ?? item.requestedQty)} {item.unit}</td>
                            <td>
                              <Input
                                type="number"
                                className="h-7 w-24"
                                value={receiveItemQtys[item.id] ?? ""}
                                onChange={(e) =>
                                  setReceiveItemQtys({ ...receiveItemQtys, [item.id]: e.target.value })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setReceiveIndentId(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => receiveIndentMutation.mutate(receiveIndentId)}
                    disabled={receiveIndentMutation.isPending}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {receiveIndentMutation.isPending ? "Receiving…" : "Confirm Goods Received"}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIRECT INSTANT STOCK TRANSFER */}
      {activeTab === "direct" && (
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-4">
            <h3 className="text-base font-semibold text-foreground">Direct Inter-Branch Stock Movement</h3>
            <p className="text-xs text-muted-foreground">
              Immediately move ingredient batches between outlets without requisition indents
            </p>

            {otherBranches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a second branch to transfer stock between locations.</p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="tr-ing" className="text-xs text-muted-foreground">Ingredient (this branch)</label>
                  <select id="tr-ing" className={selectCls} value={ingredientId} onChange={(e) => setIngredient(e.target.value)}>
                    <option value="">Choose…</option>
                    {ingredients?.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.currentStock} {i.unit})</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="tr-qty" className="text-xs text-muted-foreground">Quantity{ingredient ? ` (${ingredient.unit})` : ""}</label>
                  <Input id="tr-qty" type="number" min="0" step="0.001" className="w-32" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="tr-to" className="text-xs text-muted-foreground">To branch</label>
                  <select id="tr-to" className={selectCls} value={toBranchId} onChange={(e) => setTo(e.target.value)}>
                    <option value="">Choose…</option>
                    {otherBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="tr-note" className="text-xs text-muted-foreground">Note</label>
                  <Input id="tr-note" className="w-52" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <Button disabled={!ingredientId || !toBranchId || !(Number(quantity) > 0) || sendTransfer.isPending} onClick={() => sendTransfer.mutate()}>
                  {sendTransfer.isPending ? "Moving…" : "Transfer Now"}
                </Button>
              </div>
            )}
          </Card>

          <Card className="overflow-x-auto p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Direct Transfer Ledger</h4>
            {isTransferLoading ? (
              <Skeleton className="h-24" />
            ) : transferData && transferData.history.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr><th className="py-1">When</th><th>Ingredient</th><th>Quantity</th><th>Route</th><th className="text-right">Cost / unit</th></tr>
                </thead>
                <tbody>
                  {transferData.history.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="py-1.5 whitespace-nowrap">{t.createdAt.slice(0, 16).replace("T", " ")}</td>
                      <td>{t.ingredientName}{t.note ? <span className="block text-xs text-muted-foreground">{t.note}</span> : null}</td>
                      <td className="tabular-nums">{t.quantity} {t.unit}</td>
                      <td><span className="inline-flex items-center gap-1.5">{t.fromBranchName} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /> {t.toBranchName}</span></td>
                      <td className="text-right tabular-nums">{formatCurrency(Number(t.unitCost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No direct transfers recorded yet.</p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: CENTRAL KITCHEN SETTINGS */}
      {activeTab === "kitchens" && (
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Central Kitchen & Commissary Configuration</h3>
            <p className="text-xs text-muted-foreground">
              Designate master warehouses or base kitchens that fulfill stock indents for satellite outlets
            </p>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {(branches || []).map((branch) => {
              const isCK = (branch as any).isCentralKitchen ?? false;
              return (
                <div key={branch.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2.5", isCK ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                      <ChefHat className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{branch.name}</span>
                        {isCK && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                            Central Kitchen Hub
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isCK
                          ? "Fulfills multi-outlet requisitions and cold-chain transfers"
                          : "Standard satellite dining / takeaway outlet"}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant={isCK ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleKitchenMutation.mutate({ id: branch.id, isCentral: !isCK })}
                    disabled={toggleKitchenMutation.isPending}
                  >
                    {isCK ? "Revoke Central Kitchen" : "Designate as Central Kitchen"}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
