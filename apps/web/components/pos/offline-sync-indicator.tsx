"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  flushOutbox,
  getLastSyncTime,
  getOutboxItems,
  isDeviceOnline,
  removeItemFromOutbox,
  retryOutboxItem,
  subscribeOutbox,
  type OutboxAction,
} from "@/lib/offline-outbox";

export function OfflineSyncIndicator() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<OutboxAction[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setIsOnline(isDeviceOnline());
    setLastSync(getLastSyncTime());

    const unsubscribe = subscribeOutbox((newItems, online, syncing) => {
      setItems(newItems);
      setIsOnline(online);
      setIsSyncing(syncing);
      setLastSync(getLastSyncTime());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const pendingItems = items.filter((i) => i.status === "PENDING" || i.status === "FAILED");
  const pendingCount = pendingItems.length;

  const handleManualSync = async () => {
    await flushOutbox(queryClient);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 select-none cursor-pointer shadow-xs hover:opacity-90 active:scale-95"
        style={{
          backgroundColor: !isOnline
            ? "rgba(239, 68, 68, 0.12)"
            : pendingCount > 0
            ? "rgba(245, 158, 11, 0.12)"
            : "rgba(16, 185, 129, 0.12)",
          borderColor: !isOnline
            ? "rgba(239, 68, 68, 0.35)"
            : pendingCount > 0
            ? "rgba(245, 158, 11, 0.35)"
            : "rgba(16, 185, 129, 0.35)",
          color: !isOnline
            ? "#dc2626"
            : pendingCount > 0
            ? "#d97706"
            : "#059669",
        }}
        aria-label="Offline Sync Status"
      >
        {!isOnline ? (
          <>
            <WifiOff className="size-3.5 shrink-0" />
            <span className="font-bold">Offline ({pendingCount})</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw className={`size-3.5 shrink-0 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Syncing ({pendingCount})</span>
          </>
        ) : (
          <>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Cloud Synced</span>
            <span className="sm:hidden">Online</span>
          </>
        )}
      </button>

      {/* DIALOG: OFFLINE OUTBOX & CLOUD SYNC MONITOR */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <span>Petpooja-Grade Offline POS Sync Engine</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Continuous local billing with automatic background cloud synchronization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Status Summary Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  {isOnline ? <Wifi className="size-3 text-emerald-500" /> : <WifiOff className="size-3 text-rose-500" />}
                  <span>Network Status</span>
                </div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span>{isOnline ? "Cloud Online (Connected)" : "Offline Local Mode"}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Cloud className="size-3 text-blue-500" />
                  <span>Outbox Queue</span>
                </div>
                <div className="font-bold text-sm">
                  {pendingCount === 0 ? "0 Pending Actions" : `${pendingCount} Offline Bill(s)`}
                </div>
              </div>
            </div>

            {/* Offline Explanation Card */}
            <div className="rounded-xl border border-border/60 bg-card p-3 text-[11px] space-y-1 text-muted-foreground">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Zero-Downtime Offline Outbox</span>
              </div>
              <p>
                When internet disconnects at the restaurant counter, KIVO automatically records orders and bills into local encrypted device storage. You can continue taking orders and printing thermal receipts without interruption.
              </p>
              {lastSync && (
                <div className="pt-1 text-[10px] text-muted-foreground font-mono">
                  Last successful cloud sync: {new Date(lastSync).toLocaleTimeString("en-IN")}
                </div>
              )}
            </div>

            {/* Pending Outbox List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span>Queued Offline Actions ({items.length})</span>
                {pendingCount > 0 && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px]">
                    {pendingCount} AWAITING CLOUD SYNC
                  </Badge>
                )}
              </div>

              <div className="rounded-xl border border-border/60 divide-y divide-border/40 max-h-48 overflow-y-auto">
                {items.length > 0 ? (
                  items.map((it) => (
                    <div key={it.id} className="p-2.5 flex items-center justify-between hover:bg-muted/30">
                      <div className="space-y-0.5 max-w-[280px]">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{it.orderSummary.orderNumber}</span>
                          <span className="text-muted-foreground font-normal">· {it.orderSummary.tableName}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {it.type === "CREATE_ORDER" ? "New Order" : "Checkout Settle"} · {it.orderSummary.itemsCount} item(s) · ₹{it.orderSummary.totalAmount}
                        </div>
                        {it.error && (
                          <div className="text-[10px] text-rose-500 font-medium truncate">
                            Error: {it.error} {it.retries > 0 ? `(${it.retries} retries)` : ""}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {it.status === "FAILED" && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => retryOutboxItem(it.id)}
                              className="text-[10px] font-semibold text-blue-600 hover:underline px-1 cursor-pointer"
                            >
                              Retry
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItemFromOutbox(it.id)}
                              className="text-[10px] font-semibold text-rose-600 hover:underline px-1 cursor-pointer"
                            >
                              Discard
                            </button>
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-mono ${
                            it.status === "SYNCED"
                              ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                              : it.status === "SYNCING"
                              ? "border-blue-500 text-blue-600 bg-blue-500/10"
                              : it.status === "FAILED"
                              ? "border-rose-500 text-rose-600 bg-rose-500/10"
                              : "border-amber-500 text-amber-600 bg-amber-500/10"
                          }`}
                        >
                          {it.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-[11px]">
                    No pending actions in outbox. All restaurant orders are fully synced to the cloud.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-3 flex sm:justify-between items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-9 text-xs">
              Close
            </Button>
            <Button
              size="sm"
              disabled={isSyncing || !isOnline || pendingCount === 0}
              onClick={handleManualSync}
              className="h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Outbox Now"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
