import assert from "node:assert/strict";
import { getEffectivePriceCents } from "../lib/utils/pricing.ts";

assert.equal(getEffectivePriceCents({ priceCents: 1000 }), 1000);
assert.equal(
  getEffectivePriceCents({
    priceCents: 1250,
    discountEnabled: true,
    discountPercent: 10,
  }),
  1125,
);
assert.equal(
  getEffectivePriceCents({ priceCents: 999, discountEnabled: true, discountPercent: 99 }),
  10,
);
assert.equal(
  getEffectivePriceCents({
    priceCents: 500,
    discountEnabled: false,
    discountPercent: 50,
  }),
  500,
);

console.log("pricing.test.ts passed");
