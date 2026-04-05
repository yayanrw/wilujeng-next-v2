import { describe, expect, it } from "vitest";

import { computePayment } from "./checkout";

describe("computePayment", () => {
  it("treats amountReceived < total as debt", () => {
    expect(computePayment({ totalAmount: 12000, paymentMethod: "cash", amountReceived: 10000 })).toEqual({
      status: "debt",
      change: 0,
      outstandingDebt: 2000,
    });
  });

  it("treats method=debt and amountReceived=0 as full debt", () => {
    expect(computePayment({ totalAmount: 12000, paymentMethod: "debt", amountReceived: 0 })).toEqual({
      status: "debt",
      change: 0,
      outstandingDebt: 12000,
    });
  });

  it("treats amountReceived >= total as paid", () => {
    expect(computePayment({ totalAmount: 12000, paymentMethod: "qris", amountReceived: 15000 })).toEqual({
      status: "paid",
      change: 3000,
      outstandingDebt: 0,
    });
  });
});

