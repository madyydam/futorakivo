"use client";

import type { CheckoutDto, CreateOrderDto } from "@futora/types";
import { api } from "./api.ts";
import { toast } from "./toast.ts";

export interface OfflineItemSummary {
  name: string;
  quantity: number;
  price: string;
}

export interface OfflineOrderMetadata {
  estimatedTotal?: number | string;
  itemsSummary?: OfflineItemSummary[];
}

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
    items?: OfflineItemSummary[];
  };
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  error?: string;
  retries: number;
  createdAt: number;
}

const STORAGE_KEY = "kivo.pos.outbox.v1";
const LAST_SYNC_KEY = "kivo.pos.last_sync.v1";
const ID_MAP_KEY = "kivo.pos.id_map.v1";
const SYNC_LOCK_KEY = "kivo.pos.sync_lock.v1";
const MAX_RETRIES = 5;

type OutboxSubscriber = (items: OutboxAction[], isOnline: boolean, isSyncing: boolean) => void;
const subscribers = new Set<OutboxSubscriber>();

let isSyncing = false;
let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

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
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OutboxAction[];
  } catch {
    return [];
  }
}

function saveOutboxItems(items: OutboxAction[]) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save offline outbox:", e);
  }
  notify();
}

/** Persistent mapping of local offline IDs to server IDs */
function getIdMap(): Record<string, string> {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(ID_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveIdMapping(tempId: string, serverId: string) {
  const storage = getStorage();
  if (!storage) return;
  try {
    const map = getIdMap();
    map[tempId] = serverId;
    storage.setItem(ID_MAP_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to persist ID mapping:", e);
  }
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
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(LAST_SYNC_KEY);
}

/**
 * Queue a new order for offline processing when network is down
 */
export function queueOfflineOrder(
  branchId: string,
  dto: CreateOrderDto,
  metadata?: OfflineOrderMetadata
) {
  const tempOrderId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const orderNumber = `OFF-${Math.floor(100 + Math.random() * 900)}`;

  let calculatedTotal = 0;
  if (metadata?.estimatedTotal != null) {
    calculatedTotal = Number(metadata.estimatedTotal) || 0;
  }

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
      totalAmount: calculatedTotal > 0 ? calculatedTotal.toFixed(2) : "0.00",
      itemsCount: itemsCount || 1,
      orderNumber,
      createdAt: new Date().toISOString(),
      items: metadata?.itemsSummary,
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
      subtotal: action.orderSummary.totalAmount,
      taxAmount: "0.00",
      discountAmount: "0.00",
      tipAmount: "0.00",
      loyaltyPointsRedeemed: 0,
      loyaltyDiscountAmount: "0.00",
      totalAmount: action.orderSummary.totalAmount,
      status: "OPEN",
    },
    outboxId: action.id,
  };
}

/**
 * Queue checkout payment for an offline or online order
 */
export function queueOfflineCheckout(branchId: string, orderId: string, dto: CheckoutDto) {
  const items = getOutboxItems();
  const existingOrder = items.find((i) => i.tempOrderId === orderId || i.id === orderId);

  const totalAmount =
    dto.payments?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)?.toFixed(2) ||
    existingOrder?.orderSummary?.totalAmount ||
    "0.00";

  const action: OutboxAction = {
    id: `act_pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: "CHECKOUT_ORDER",
    branchId,
    tempOrderId: orderId,
    payload: dto,
    orderSummary: {
      totalAmount,
      itemsCount: existingOrder?.orderSummary?.itemsCount || 1,
      orderNumber: existingOrder?.orderSummary?.orderNumber || (orderId.startsWith("off_") ? `OFF-${orderId.slice(-4)}` : orderId.slice(-4)),
      createdAt: new Date().toISOString(),
      items: existingOrder?.orderSummary?.items,
    },
    status: "PENDING",
    retries: 0,
    createdAt: Date.now(),
  };

  items.push(action);
  saveOutboxItems(items);

  return {
    tempResult: {
      id: orderId,
      orderNumber: action.orderSummary.orderNumber,
      subtotal: totalAmount,
      taxAmount: "0.00",
      discountAmount: "0.00",
      tipAmount: "0.00",
      loyaltyPointsRedeemed: 0,
      loyaltyDiscountAmount: "0.00",
      totalAmount,
      status: "PAID",
      settlement: {
        amountDue: Number(totalAmount),
        amountPaid: Number(totalAmount),
        balanceDue: 0,
        changeDue: 0,
        fullyPaid: true,
      },
    },
    outboxId: action.id,
  };
}

/**
 * Flush all pending offline outbox items to cloud backend with concurrency lock
 */
export async function flushOutbox(qc?: any): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  const storage = getStorage();

  // Multi-tab concurrency mutex (15-second TTL)
  const now = Date.now();
  if (storage) {
    const lockVal = storage.getItem(SYNC_LOCK_KEY);
    if (lockVal && now - Number(lockVal) < 15000) {
      return { synced: 0, failed: 0 };
    }
    storage.setItem(SYNC_LOCK_KEY, String(now));
  }

  const items = getOutboxItems();
  const pending = items.filter((i) => i.status === "PENDING" || (i.status === "FAILED" && i.retries < MAX_RETRIES));

  if (pending.length === 0) {
    storage?.removeItem(SYNC_LOCK_KEY);
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  notify();

  let syncedCount = 0;
  let failedCount = 0;
  const idMap = getIdMap();

  try {
    for (const item of items) {
      if (item.status === "SYNCED") continue;
      if (item.status === "FAILED" && item.retries >= MAX_RETRIES) continue;

      item.status = "SYNCING";
      saveOutboxItems(items);

      try {
        if (item.type === "CREATE_ORDER") {
          // Send to server with x-client-request-id for strict idempotency
          const res = await api.post<{ id: string; orderNumber: string }>(
            `/orders?branchId=${item.branchId}`,
            item.payload,
            { headers: { "x-client-request-id": item.tempOrderId } }
          );

          item.status = "SYNCED";
          item.serverOrderId = res.id;
          saveIdMapping(item.tempOrderId, res.id);
          idMap[item.tempOrderId] = res.id;

          // Cascade resolved serverOrderId to any dependent checkout actions in the current queue
          for (const other of items) {
            if (other.tempOrderId === item.tempOrderId && other.id !== item.id) {
              other.tempOrderId = res.id;
              other.serverOrderId = res.id;
            }
          }

          syncedCount++;
        } else if (item.type === "CHECKOUT_ORDER") {
          // Resolve target orderId from persistent ID map or current memory map
          const targetOrderId = idMap[item.tempOrderId] || item.tempOrderId;

          // If the order was created offline and has not yet synced, wait for next flush
          if (targetOrderId.startsWith("off_")) {
            console.warn(`Postponing checkout for unsynced offline order ${targetOrderId}`);
            item.status = "PENDING";
            continue;
          }

          const checkoutPayload = {
            ...item.payload,
            requestId: item.payload?.requestId || item.id,
          };

          await api.post(
            `/orders/${targetOrderId}/checkout?branchId=${item.branchId}`,
            checkoutPayload,
            { headers: { "x-client-request-id": item.id } }
          );

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

      storage?.setItem(LAST_SYNC_KEY, new Date().toISOString());
      toast.success(`☁️ Cloud Sync: ${syncedCount} offline action(s) synced to server.`);

      if (qc && typeof qc.invalidateQueries === "function") {
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["floors"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }
    }
  } finally {
    isSyncing = false;
    storage?.removeItem(SYNC_LOCK_KEY);
    notify();
  }

  return { synced: syncedCount, failed: failedCount };
}

/**
 * Remove an item permanently from the outbox (e.g. if rejected or discarded)
 */
export function removeItemFromOutbox(id: string) {
  const items = getOutboxItems().filter((i) => i.id !== id);
  saveOutboxItems(items);
}

/**
 * Reset a failed item to PENDING status
 */
export function resetOutboxItem(id: string) {
  const items = getOutboxItems();
  const it = items.find((i) => i.id === id);
  if (it) {
    it.status = "PENDING";
    it.retries = 0;
    it.error = undefined;
    saveOutboxItems(items);
  }
}

/**
 * Retry a failed item immediately
 */
export async function retryOutboxItem(id: string) {
  resetOutboxItem(id);
  return flushOutbox();
}

/**
 * Global background sync initializer and cross-tab listener for browser window
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

  // Cross-tab synchronization
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === LAST_SYNC_KEY) {
      notify();
    }
  });

  // Periodic heartbeat / auto-flush every 20 seconds if online and pending items exist
  setInterval(() => {
    isOnline = navigator.onLine;
    const items = getOutboxItems();
    if (isOnline && items.some((i) => i.status === "PENDING" || (i.status === "FAILED" && i.retries < MAX_RETRIES))) {
      flushOutbox().catch(console.error);
    }
  }, 20000);
}
