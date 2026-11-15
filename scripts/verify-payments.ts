import assert from "node:assert/strict";
import { canTransition } from "../src/lib/payments/transitions";

assert.equal(canTransition("PENDING", "PAID"), true);
assert.equal(canTransition("PENDING", "FAILED"), true);
assert.equal(canTransition("PENDING", "CANCELLED"), true);
assert.equal(canTransition("PENDING", "REVIEW"), true);
assert.equal(canTransition("PAID", "REFUNDED"), true);
assert.equal(canTransition("PAID", "FAILED"), false);
assert.equal(canTransition("FAILED", "PAID"), false);
assert.equal(canTransition("REFUNDED", "PAID"), false);
assert.equal(canTransition("CANCELLED", "PAID"), false);
assert.equal(canTransition("REVIEW", "PAID"), true);

console.log("Transitions de paiement : OK");
