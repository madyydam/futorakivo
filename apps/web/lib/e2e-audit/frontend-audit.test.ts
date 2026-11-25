import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { DEFAULT_ROLE_PERMISSIONS, permissionSatisfied } from "@futora/types";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

import { parseCsvLine } from "../csv.ts";
import { flushOutbox, getOutboxItems, queueOfflineOrder } from "../offline-outbox.ts";
import { canOpen } from "../route-access.ts";

beforeEach(() => {
  localStorage.clear();
});

test("E2E web audit: canonical permission implications align across frontend route guards", () => {
  assert.equal(permissionSatisfied(["bill.generate_settle"], "bills.print"), true);
  assert.equal(permissionSatisfied(["discount.apply_small"], "discounts.apply"), true);
  assert.equal(permissionSatisfied(["discount.apply_small"], "discounts.unlimited"), false);
  assert.equal(
    canOpen("/menu", DEFAULT_ROLE_PERMISSIONS.CHEF, [{ href: "/menu", permission: "menu.view" }]),
    true,
  );
  assert.equal(
    canOpen("/kds", DEFAULT_ROLE_PERMISSIONS.KITCHEN_STAFF, [{ href: "/kds", permission: "kds.manage" }]),
    true,
  );
});

test("E2E web audit: onboarding menu CSV parser preserves spaced titles and quoted commas", () => {
  const row = parseCsvLine('Paneer Butter Masala,"North Indian, Mains",320,5,true');
  assert.deepEqual(row, ["Paneer Butter Masala", "North Indian, Mains", "320", "5", "true"]);
});

test("E2E web audit: crashed SYNCING outbox item recovers and resolved idMap key prunes", async () => {
  const { tempOrder } = queueOfflineOrder("branch-audit", {
    type: "DINE_IN",
    tableId: "table-1",
    items: [{ menuItemId: "item-1", quantity: 1, modifierIds: [] }],
  });
  const stuck = getOutboxItems().map((x) => ({ ...x, status: "SYNCING" }));
  localStorage.setItem("kivo.pos.outbox.v1", JSON.stringify(stuck));

  const origFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ id: "srv-901", orderNumber: "ORD-901" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;

  try {
    const res = await flushOutbox();
    assert.equal(res.synced, 1);
    assert.equal(getOutboxItems().length, 0);
    const idMap = JSON.parse(localStorage.getItem("kivo.pos.id_map.v1") || "{}");
    assert.equal(idMap[tempOrder.id], undefined);
  } finally {
    globalThis.fetch = origFetch;
  }
});
