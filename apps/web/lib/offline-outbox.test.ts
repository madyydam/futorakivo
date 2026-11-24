import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

// Mock localStorage if running in plain Node environment
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

import {
  cancelOfflineOrder,
  getOutboxItems,
  queueOfflineAddItems,
  queueOfflineCheckout,
  queueOfflineOrder,
  removeItemFromOutbox,
  resetOutboxItem,
  retryOutboxItem,
  subscribeOutbox,
} from "./offline-outbox.ts";

beforeEach(() => {
  localStorage.clear();
});

test("queueOfflineOrder creates a pending outbox item with OFF- ticket and itemized metadata", () => {
  const result = queueOfflineOrder(
    "branch-1",
    {
      type: "DINE_IN",
      tableId: "table-1",
      items: [
        { menuItemId: "item-1", quantity: 2, modifierIds: [] },
        { menuItemId: "item-2", quantity: 1, modifierIds: [] },
      ],
    },
    {
      estimatedTotal: 350,
      itemsSummary: [
        { name: "Paneer Butter Masala", quantity: 2, price: "300.00" },
        { name: "Butter Naan", quantity: 1, price: "50.00" },
      ],
    }
  );

  assert.ok(result.tempOrder.id.startsWith("off_"));
  assert.ok(result.tempOrder.orderNumber.startsWith("OFF-"));
  assert.equal(result.tempOrder.status, "OPEN");
  assert.equal(result.tempOrder.totalAmount, "350.00");

  const items = getOutboxItems();
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "CREATE_ORDER");
  assert.equal(items[0].status, "PENDING");
  assert.equal(items[0].orderSummary.itemsCount, 3);
  assert.equal(items[0].orderSummary.totalAmount, "350.00");
  assert.equal(items[0].orderSummary.items?.length, 2);
});

test("queueOfflineCheckout calculates cash change and records payment breakdown", () => {
  const result = queueOfflineCheckout("branch-1", "off_12345", {
    payments: [{ method: "CASH", amount: 250, tendered: 500 }],
  });

  assert.equal(result.tempResult.id, "off_12345");
  assert.equal(result.tempResult.status, "PAID");
  assert.equal(result.tempResult.settlement.fullyPaid, true);
  assert.equal(result.tempResult.settlement.amountPaid, 250);
  assert.equal(result.tempResult.settlement.changeDue, 250);

  const items = getOutboxItems();
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "CHECKOUT_ORDER");
  assert.equal(items[0].orderSummary.totalAmount, "250.00");
  assert.equal(items[0].orderSummary.payments?.[0].changeGiven, 250);
});

test("subscribeOutbox notifies subscriber immediately and on updates", () => {
  let callCount = 0;
  let receivedCount = 0;

  const unsubscribe = subscribeOutbox((items) => {
    callCount++;
    receivedCount = items.length;
  });

  assert.equal(callCount, 1);
  assert.equal(receivedCount, 0);

  queueOfflineOrder("branch-1", {
    type: "TAKEAWAY",
    items: [{ menuItemId: "item-1", quantity: 1, modifierIds: [] }],
  });

  assert.equal(callCount, 2);
  assert.equal(receivedCount, 1);

  unsubscribe();
});

test("removeItemFromOutbox removes action and resetOutboxItem resets status", () => {
  const res = queueOfflineOrder("branch-1", {
    type: "TAKEAWAY",
    items: [{ menuItemId: "item-1", quantity: 1, modifierIds: [] }],
  });

  let items = getOutboxItems();
  assert.equal(items.length, 1);

  // Set to failed
  items[0].status = "FAILED";
  items[0].error = "Network timeout";
  items[0].retries = 3;
  localStorage.setItem("kivo.pos.outbox.v1", JSON.stringify(items));

  // Reset
  resetOutboxItem(res.outboxId);
  items = getOutboxItems();
  assert.equal(items[0].status, "PENDING");
  assert.equal(items[0].retries, 0);

  // Remove
  removeItemFromOutbox(res.outboxId);
  items = getOutboxItems();
  assert.equal(items.length, 0);
});

test("queueOfflineAddItems appends items to existing offline order", () => {
  const initial = queueOfflineOrder(
    "branch-1",
    {
      type: "DINE_IN",
      tableId: "table-1",
      items: [{ menuItemId: "item-1", quantity: 1, modifierIds: [] }],
    },
    { estimatedTotal: 100 }
  );

  const updated = queueOfflineAddItems(
    "branch-1",
    initial.tempOrder.id,
    [{ menuItemId: "item-2", quantity: 2, modifierIds: [] }],
    { addedTotal: 200 }
  );

  assert.ok(updated);
  assert.equal(updated.subtotal, "300.00");
  assert.equal(updated.totalAmount, "300.00");

  const items = getOutboxItems();
  assert.equal(items.length, 1);
  assert.equal(items[0].orderSummary.itemsCount, 3);
  assert.equal(items[0].orderSummary.totalAmount, "300.00");
  assert.equal(items[0].payload.items.length, 2);
});

test("cancelOfflineOrder removes offline order and pending checkouts from outbox", () => {
  const initial = queueOfflineOrder("branch-1", {
    type: "DINE_IN",
    tableId: "table-1",
    items: [{ menuItemId: "item-1", quantity: 1, modifierIds: [] }],
  });

  queueOfflineCheckout("branch-1", initial.tempOrder.id, {
    payments: [{ method: "CASH", amount: 100 }],
  });

  assert.equal(getOutboxItems().length, 2);

  const res = cancelOfflineOrder(initial.tempOrder.id);
  assert.equal(res.status, "CANCELLED");

  assert.equal(getOutboxItems().length, 0);
});

test("queueOfflineAddItems queues ADD_ITEMS action for an existing server order when offline", () => {
  const result = queueOfflineAddItems(
    "branch-1",
    "ord_server_999",
    [{ menuItemId: "item-3", quantity: 2, modifierIds: [] }],
    {
      addedTotal: 150,
      itemsSummary: [{ name: "Cold Coffee", quantity: 2, price: "150.00" }],
    }
  );

  assert.ok(result);
  assert.equal(result.id, "ord_server_999");
  assert.equal(result.totalAmount, "150.00");

  const items = getOutboxItems();
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "ADD_ITEMS");
  assert.equal(items[0].tempOrderId, "ord_server_999");
  assert.equal(items[0].orderSummary.itemsCount, 2);
  assert.equal(items[0].orderSummary.items?.[0].name, "Cold Coffee");
});
