"use client";

import type { CheckoutDto, CreateOrderDto } from "@futora/types";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

export interface OutboxAction {
  id: string;
  type: "CREATE_ORDER" | "CHECKOUT_ORDER";
  branchId: string;
  tempOrderId: string;
  serverOrderId?: string;
  payload: any;
  orderSummary: {
    tableId?: string;
    tableName?: string;
    totalAmount: string;
    itemsCount: number;
    orderNumber: string;
    createdAt: string;
  };
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  error?: string;
  retries: number;
  createdAt: number;
}

const STORAGE_KEY = "kivo.pos.outbox.v1";
const LAST_SYNC_KEY = "kivo.pos.last_sync.v1";

type OutboxSubscriber = (items: OutboxAction[], isOnline: boolean, isSyncing: boolean) => void;
const subscribers = new Set<OutboxSubscriber>();

let isSyncing = false;
let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

function notify() {
  const items = getOutboxItems();
  subscribers.forEach((cb) => {
    try {
      cb(items, isOnline, isSyncing);
    } catch (e) {
      console.error("Outbox subscriber error:", e);
    }
  });
}

export function getOutboxItems(): OutboxAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OutboxAction[];
  } catch {
    return [];
  }
}

function saveOutboxItems(items: OutboxAction[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save offline outbox:", e);
  }
  notify();
}

export function subscribeOutbox(callback: OutboxSubscriber) {
  subscribers.add(callback);
  callback(getOutboxItems(), isOnline, isSyncing);
  return () => {
    subscribers.delete(callback);
  };
}

export function isDeviceOnline(): boolean {
  return isOnline;
}

export function getLastSyncTime(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

/**
 * Queue a new order for offline processing when network is down
 */
export function queueOfflineOrder(branchId: string, dto: CreateOrderDto) {
  const tempOrderId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const orderNumber = `OFF-${Math.floor(100 + Math.random() * 900)}`;

  let calculatedTotal = 0;
  let itemsCount = 0;
  if (Array.isArray(dto.items)) {
    itemsCount = dto.items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
  }

  const action: OutboxAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: "CREATE_ORDER",
    branchId,
    tempOrderId,
    payload: dto,
    orderSummary: {
      tableId: dto.tableId,
      tableName: dto.tableId ? `Table ${dto.tableId.slice(-3)}` : "Takeaway / Direct",
      totalAmount: calculatedTotal.toFixed(2),
      itemsCount: itemsCount || 1,
      orderNumber,
      createdAt: new Date().toISOString(),
    },
    status: "PENDING",
    retries: 0,
    createdAt: Date.now(),
  };

  const items = getOutboxItems();
  items.push(action);
  saveOutboxItems(items);

  return {
    tempOrder: {
      id: tempOrderId,
      orderNumber,
      subtotal: calculatedTotal.toFixed(2),
      taxAmount: "0.00",
      discountAmount: "0.00",
      tipAmount: "0.00",
      loyaltyPointsRedeemed: 0,
      loyaltyDiscountAmount: "0.00",
      totalAmount: calculatedTotal.toFixed(2),
      status: "OPEN",
    },
    outboxId: action.id,
  };
}

/**
 * Queue checkout payment for an offline or online order
 */
export function queueOfflineCheckout(branchId: string, orderId: string, dto: CheckoutDto) {
  const action: OutboxAction = {
    id: `act_pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: "CHECKOUT_ORDER",
    branchId,
    tempOrderId: orderId,
    payload: dto,
    orderSummary: {
      totalAmount: dto.payments?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)?.toFixed(2) || "0.00",
      itemsCount: 1,
      orderNumber: orderId.startsWith("off_") ? `OFF-${orderId.slice(-4)}` : orderId.slice(-4),
      createdAt: new Date().toISOString(),
    },
    status: "PENDING",
    retries: 0,
    createdAt: Date.now(),
  };

  const items = getOutboxItems();
  items.push(action);
  saveOutboxItems(items);

  return {
    tempResult: {
      id: orderId,
      orderNumber: action.orderSummary.orderNumber,
      subtotal: action.orderSummary.totalAmount,
      taxAmount: "0.00",
      discountAmount: "0.00",
      tipAmount: "0.00",
      loyaltyPointsRedeemed: 0,
      loyaltyDiscountAmount: "0.00",
      totalAmount: action.orderSummary.totalAmount,
      status: "PAID",
      settlement: {
        amountDue: Number(action.orderSummary.totalAmount),
        amountPaid: Number(action.orderSummary.totalAmount),
        balanceDue: 0,
        changeDue: 0,
        fullyPaid: true,
      },
    },
    outboxId: action.id,
  };
}

/**
 * Flush all pending offline outbox items to cloud backend
 */
export async function flushOutbox(qc?: any): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  const items = getOutboxItems();
  const pending = items.filter((i) => i.status === "PENDING" || i.status === "FAILED");

  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  notify();

  let syncedCount = 0;
  let failedCount = 0;
  const tempToServerIdMap = new Map<string, string>();

  try {
    for (const item of items) {
      if (item.status === "SYNCED") continue;

      item.status = "SYNCING";
      saveOutboxItems(items);

      try {
        if (item.type === "CREATE_ORDER") {
          // Send to server
          const res = await api.post<{ id: string; orderNumber: string }>(
            `/orders?branchId=${item.branchId}`,
            item.payload
          );

          item.status = "SYNCED";
          item.serverOrderId = res.id;
          tempToServerIdMap.set(item.tempOrderId, res.id);
          syncedCount++;
        } else if (item.type === "CHECKOUT_ORDER") {
          // Resolve orderId if created in an earlier offline action
          const targetOrderId = tempToServerIdMap.get(item.tempOrderId) || item.tempOrderId;

          await api.post(`/orders/${targetOrderId}/checkout?branchId=${item.branchId}`, item.payload);

          item.status = "SYNCED";
          syncedCount++;
        }
      } catch (err: any) {
        console.warn(`Sync failed for action ${item.id}:`, err);
        item.status = "FAILED";
        item.error = err?.message || "Sync failed";
        item.retries += 1;
        failedCount++;
      }

      saveOutboxItems(items);
    }

    if (syncedCount > 0) {
      // Remove synced items from local outbox after successful push
      const remaining = items.filter((i) => i.status !== "SYNCED");
      saveOutboxItems(remaining);

      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      toast.success(`☁️ Cloud Sync: ${syncedCount} offline bill(s) synced to server.`);

      if (qc && typeof qc.invalidateQueries === "function") {
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["floors"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }
    }
  } finally {
    isSyncing = false;
    notify();
  }

  return { synced: syncedCount, failed: failedCount };
}

/**
 * Global background sync initializer for browser window
 */
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isOnline = true;
    notify();
    toast.info("🌐 Internet connection restored. Syncing offline outbox...");
    flushOutbox().catch(console.error);
  });

  window.addEventListener("offline", () => {
    isOnline = false;
    notify();
    toast.warning("⚡ Network offline: POS switched to local offline billing mode.");
  });

  // Periodic heartbeat / auto-flush every 20 seconds if online and pending items exist
  setInterval(() => {
    isOnline = navigator.onLine;
    const items = getOutboxItems();
    if (isOnline && items.some((i) => i.status === "PENDING" || i.status === "FAILED")) {
      flushOutbox().catch(console.error);
    }
  }, 20000);
}
