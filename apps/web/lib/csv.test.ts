import assert from "node:assert/strict";
import test from "node:test";
import { parseCsvLine } from "./csv.ts";

test("parseCsvLine preserves multi-word item names without quotes", () => {
  assert.deepEqual(
    parseCsvLine("Paneer Butter Masala,Main Course,320,5,true"),
    ["Paneer Butter Masala", "Main Course", "320", "5", "true"],
  );
});

test("parseCsvLine preserves commas inside quoted descriptions and empty cells", () => {
  assert.deepEqual(
    parseCsvLine('"Masala, Special",Starters,,18,false,"Chef ""Signature"" Dish"'),
    ["Masala, Special", "Starters", "", "18", "false", 'Chef "Signature" Dish'],
  );
});
