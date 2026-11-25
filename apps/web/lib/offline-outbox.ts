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
  type: "CREATE_ORDER" | "CHECKOUT_ORDER" | "ADD_ITEMS";
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
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    payments?: Array<{ method: string; amount: number; tendered?: number | null; changeGiven?: number | null }>;
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
const TAB_LOCK_ID =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `tab_${Math.random().toString(36).slice(2)}_${Date.now()}`;

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

function pruneIdMap(remaining: OutboxAction[]) {
  const storage = getStorage();
  if (!storage) return;
  try {
    const map = getIdMap();
    const keys = Object.keys(map);
    if (keys.length === 0) return;
    const activeTempIds = new Set(remaining.map((i) => i.tempOrderId));
    let changed = false;
    for (const k of keys) {
      if (!activeTempIds.has(k)) {
        delete map[k];
        changed = true;
      }
    }
    if (!changed) return;
    if (Object.keys(map).length === 0) {
      storage.removeItem(ID_MAP_KEY);
    } else {
      storage.setItem(ID_MAP_KEY, JSON.stringify(map));
    }
  } catch {
    // ignore
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
      customerName: dto.guestName,
      customerPhone: dto.delivery?.phone,
      deliveryAddress: dto.delivery?.address,
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

  const totalPaid = dto.payments?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;
  const totalTendered = dto.payments?.reduce((acc, p) => acc + (Number(p.tendered ?? p.amount) || 0), 0) || totalPaid;
  const changeDue = Math.max(0, totalTendered - totalPaid);

  const totalAmount =
    totalPaid > 0
      ? totalPaid.toFixed(2)
      : existingOrder?.orderSummary?.totalAmount || "0.00";

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
      customerName: existingOrder?.orderSummary?.customerName,
      customerPhone: existingOrder?.orderSummary?.customerPhone,
      deliveryAddress: existingOrder?.orderSummary?.deliveryAddress,
      payments: dto.payments?.map((p) => ({
        method: p.method,
        amount: Number(p.amount) || 0,
        tendered: p.tendered ? Number(p.tendered) : null,
        changeGiven: changeDue > 0 ? changeDue : null,
      })),
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
        amountPaid: totalPaid,
        balanceDue: 0,
        changeDue: changeDue,
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

  // Multi-tab concurrency mutex (15-second TTL, tab-owned)
  const now = Date.now();
  if (storage) {
    const lockVal = storage.getItem(SYNC_LOCK_KEY);
    if (lockVal) {
      const sep = lockVal.lastIndexOf(":");
      const owner = sep > 0 ? lockVal.slice(0, sep) : "";
      const ts = sep > 0 ? Number(lockVal.slice(sep + 1)) : Number(lockVal);
      if (owner !== TAB_LOCK_ID && Number.isFinite(ts) && now - ts < 15000) {
        return { synced: 0, failed: 0 };
      }
    }
    storage.setItem(SYNC_LOCK_KEY, `${TAB_LOCK_ID}:${now}`);
  }

  const items = getOutboxItems();
  // Recover any items left stuck in SYNCING after an abrupt tab close/crash
  let recoveredStale = false;
  for (const item of items) {
    if (item.status === "SYNCING") {
      item.status = "PENDING";
      recoveredStale = true;
    }
  }
  if (recoveredStale) {
    saveOutboxItems(items);
  }

  const pending = items.filter((i) => i.status === "PENDING" || (i.status === "FAILED" && i.retries < MAX_RETRIES));

  if (pending.length === 0) {
    const cur = storage?.getItem(SYNC_LOCK_KEY);
    if (!cur || cur.startsWith(`${TAB_LOCK_ID}:`)) {
      storage?.removeItem(SYNC_LOCK_KEY);
    }
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
          // Send to server with x-client-request-id for strict idempotency and historical timestamp
          const res = await api.post<{ id: string; orderNumber: string }>(
            `/orders?branchId=${item.branchId}`,
            item.payload,
            {
              headers: {
                "x-client-request-id": item.tempOrderId,
                "x-offline-created-at": new Date(item.createdAt).toISOString(),
              },
            }
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
            allowPartial: true,
          };

          await api.post(
            `/orders/${targetOrderId}/checkout?branchId=${item.branchId}`,
            checkoutPayload,
            { headers: { "x-client-request-id": item.id } }
          );

          item.status = "SYNCED";
          syncedCount++;
        } else if (item.type === "ADD_ITEMS") {
          const targetOrderId = idMap[item.tempOrderId] || item.tempOrderId;
          if (targetOrderId.startsWith("off_")) {
            console.warn(`Postponing add items for unsynced offline order ${targetOrderId}`);
            item.status = "PENDING";
            continue;
          }

          await api.post(
            `/orders/${targetOrderId}/items?branchId=${item.branchId}`,
            item.payload,
            { headers: { "x-client-request-id": item.id } }
          );

          item.status = "SYNCED";
          syncedCount++;
        }
      } catch (err: any) {
        console.warn(`Sync failed for action ${item.id}:`, err);
        if (err?.status === 401) {
          console.warn("Outbox sync paused: Session expired / unauthorized.");
          toast.warning("🔒 Please sign in to resume synchronizing offline orders.");
          item.status = "PENDING";
          saveOutboxItems(items);
          break;
        }

        const isNetDrop =
          (typeof navigator !== "undefined" && !navigator.onLine) ||
          err?.message?.includes("fetch") ||
          err?.message?.includes("NetworkError") ||
          err?.message?.includes("Failed to fetch") ||
          err?.status === 0;

        if (isNetDrop) {
          console.warn("Outbox sync paused: Network disconnection detected during flush.");
          item.status = "PENDING";
          saveOutboxItems(items);
          break;
        }

        item.status = "FAILED";
        item.error = err?.message || "Sync failed";
        item.retries += 1;
        failedCount++;
      }

      saveOutboxItems(items);
    }

    if (syncedCount > 0) {
      // Remove synced items from local outbox after successful push and prune resolved temp IDs
      const remaining = items.filter((i) => i.status !== "SYNCED");
      saveOutboxItems(remaining);
      pruneIdMap(remaining);

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
    const cur = storage?.getItem(SYNC_LOCK_KEY);
    if (!cur || cur.startsWith(`${TAB_LOCK_ID}:`)) {
      storage?.removeItem(SYNC_LOCK_KEY);
    }
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
 * Append additional items to an offline order (multi-round table ordering)
 */
export function queueOfflineAddItems(
  branchId: string,
  orderId: string,
  items: any[],
  metadata?: { itemsSummary?: OfflineItemSummary[]; addedTotal?: number }
) {
  const allActions = getOutboxItems();
  const orderAction = allActions.find((a) => a.tempOrderId === orderId && a.type === "CREATE_ORDER");
  if (orderAction) {
    if (Array.isArray(orderAction.payload.items)) {
      orderAction.payload.items.push(...items);
    }
    const addedCount = items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
    orderAction.orderSummary.itemsCount += addedCount;
    if (metadata?.addedTotal) {
      const currentTotal = Number(orderAction.orderSummary.totalAmount) || 0;
      orderAction.orderSummary.totalAmount = (currentTotal + metadata.addedTotal).toFixed(2);
    }
    if (metadata?.itemsSummary) {
      orderAction.orderSummary.items = [
        ...(orderAction.orderSummary.items || []),
        ...metadata.itemsSummary,
      ];
    }
    saveOutboxItems(allActions);
    return {
      id: orderId,
      orderNumber: orderAction.orderSummary.orderNumber,
      subtotal: orderAction.orderSummary.totalAmount,
      taxAmount: "0.00",
      discountAmount: "0.00",
      tipAmount: "0.00",
      loyaltyPointsRedeemed: 0,
      loyaltyDiscountAmount: "0.00",
      totalAmount: orderAction.orderSummary.totalAmount,
      status: "OPEN",
    };
  }

  // If adding items to a server order while offline, queue an ADD_ITEMS outbox action
  const addedCount = items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
  const action: OutboxAction = {
    id: `act_add_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: "ADD_ITEMS",
    branchId,
    tempOrderId: orderId,
    payload: { items },
    orderSummary: {
      totalAmount: metadata?.addedTotal ? metadata.addedTotal.toFixed(2) : "0.00",
      itemsCount: addedCount,
      orderNumber: orderId.slice(-4),
      createdAt: new Date().toISOString(),
      items: metadata?.itemsSummary,
    },
    status: "PENDING",
    retries: 0,
    createdAt: Date.now(),
  };

  allActions.push(action);
  saveOutboxItems(allActions);

  return {
    id: orderId,
    orderNumber: action.orderSummary.orderNumber,
    subtotal: action.orderSummary.totalAmount,
    taxAmount: "0.00",
    discountAmount: "0.00",
    tipAmount: "0.00",
    loyaltyPointsRedeemed: 0,
    loyaltyDiscountAmount: "0.00",
    totalAmount: action.orderSummary.totalAmount,
    status: "OPEN",
  };
}

/**
 * Cancel an offline order before it reaches the cloud
 */
export function cancelOfflineOrder(orderId: string) {
  const allActions = getOutboxItems();
  const remaining = allActions.filter((a) => a.tempOrderId !== orderId && a.id !== orderId);
  saveOutboxItems(remaining);
  return {
    id: orderId,
    status: "CANCELLED",
  };
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

  // Release tab-owned mutex on abrupt unload so another tab can resume immediately
  window.addEventListener("beforeunload", () => {
    const s = getStorage();
    const cur = s?.getItem(SYNC_LOCK_KEY);
    if (cur?.startsWith(`${TAB_LOCK_ID}:`)) {
      s?.removeItem(SYNC_LOCK_KEY);
    }
  });

  // Periodic heartbeat / auto-flush every 20 seconds if online and pending items exist
  setInterval(() => {
    isOnline = navigator.onLine;
    const items = getOutboxItems();
    if (
      isOnline &&
      items.some(
        (i) =>
          i.status === "PENDING" ||
          i.status === "SYNCING" ||
          (i.status === "FAILED" && i.retries < MAX_RETRIES),
      )
    ) {
      flushOutbox().catch(console.error);
    }
  }, 20000);
}
