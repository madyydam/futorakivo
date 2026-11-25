import assert from "node:assert/strict";
import test from "node:test";
import { permissionSatisfied } from "@futora/types";

test("bill.generate_settle satisfies bills.print and order.cancel_item satisfies orders.cancel", () => {
  assert.equal(permissionSatisfied(["bill.generate_settle"], "bills.print"), true);
  assert.equal(permissionSatisfied(["order.cancel_item"], "orders.cancel"), true);
  assert.equal(permissionSatisfied(["discount.apply_small"], "discounts.apply"), true);
  assert.equal(permissionSatisfied(["discount.apply_any"], "discounts.unlimited"), true);
  assert.equal(permissionSatisfied(["menu.edit"], "menu.manage"), true);
});

test("insufficient grants do not satisfy unrelated or broader permissions", () => {
  assert.equal(permissionSatisfied(["discount.apply_small"], "discounts.unlimited"), false);
  assert.equal(permissionSatisfied(["order.modify"], "order.modify_any"), false);
  assert.equal(permissionSatisfied(["bills.print"], "bill.generate_settle"), false);
});
