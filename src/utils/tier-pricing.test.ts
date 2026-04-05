import { describe, expect, it } from "vitest";

import { getTierPrice } from "./tier-pricing";

describe("getTierPrice", () => {
  it("uses base price when no tiers match", () => {
    expect(getTierPrice({ basePrice: 10000, qty: 1, tiers: [{ minQty: 10, price: 9500 }] })).toBe(10000);
  });

  it("picks the highest minQty that is <= qty", () => {
    const tiers = [
      { minQty: 1, price: 10000 },
      { minQty: 10, price: 9500 },
      { minQty: 50, price: 9000 },
    ];
    expect(getTierPrice({ basePrice: 10000, qty: 12, tiers })).toBe(9500);
    expect(getTierPrice({ basePrice: 10000, qty: 49, tiers })).toBe(9500);
    expect(getTierPrice({ basePrice: 10000, qty: 50, tiers })).toBe(9000);
  });
});

