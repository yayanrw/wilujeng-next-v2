export type PaymentMethod = "cash" | "qris" | "transfer" | "debt";
export type TxStatus = "paid" | "debt";

export function computePayment(params: {
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
}): { status: TxStatus; change: number; outstandingDebt: number } {
  const total = params.totalAmount;
  const received = params.amountReceived;

  if (params.paymentMethod === "debt" && received === 0) {
    return { status: "debt", change: 0, outstandingDebt: total };
  }

  if (received < total) {
    return { status: "debt", change: 0, outstandingDebt: total - received };
  }

  return { status: "paid", change: received - total, outstandingDebt: 0 };
}

