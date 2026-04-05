"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { usePosStore } from "@/stores/posStore";
import { computePayment, type PaymentMethod } from "@/utils/checkout";

import { CartPanel } from "./pos/CartPanel";
import { CheckoutModal } from "./pos/CheckoutModal";
import { SearchPanel } from "./pos/SearchPanel";
import { Toast } from "./pos/Toast";

export function PosClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState(0);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);

  const items = usePosStore((s) => s.items);
  const customerId = usePosStore((s) => s.customerId);
  const clear = usePosStore((s) => s.clear);

  const total = useMemo(() => items.reduce((acc, i) => acc + i.subtotal, 0), [items]);
  const payment = useMemo(
    () => computePayment({ totalAmount: total, paymentMethod, amountReceived }),
    [total, paymentMethod, amountReceived],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function doCheckout() {
    if (!items.length) return;
    if (payment.status === "debt" && !customerId) {
      setToast("Customer required for debt/partial payment");
      return;
    }

    setCheckoutPending(true);
    const res = await fetch("/api/pos/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentMethod,
        amountReceived,
        customerId: customerId ?? undefined,
      }),
    });
    const body = (await res.json().catch(() => null)) as
      | { transactionId: string }
      | { error: { message: string } }
      | null;
    setCheckoutPending(false);
    if (!res.ok) {
      setToast(body && "error" in body ? body.error.message : "Checkout failed");
      return;
    }

    if (!body || !("transactionId" in body)) {
      setToast("Checkout failed");
      return;
    }

    setLastTxId(body.transactionId);
    setCheckoutOpen(false);
    setToast("Transaction saved");
    clear();
    setAmountReceived(0);
    setPaymentMethod("cash");
    inputRef.current?.focus();
  }

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">POS</div>
        {lastTxId ? (
          <Button
            variant="secondary"
            onClick={() => {
              window.open(`/receipt/${lastTxId}`, "_blank", "noopener,noreferrer");
            }}
          >
            <Printer className="h-4 w-4" />
            Print last receipt
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <SearchPanel inputRef={inputRef} onToast={setToast} />
        <CartPanel total={total} onCheckout={() => setCheckoutOpen(true)} />
      </div>

      <Toast message={toast} />

      <CheckoutModal
        open={checkoutOpen}
        total={total}
        paymentMethod={paymentMethod}
        amountReceived={amountReceived}
        paymentStatus={payment.status}
        outstandingOrChange={payment.status === "debt" ? payment.outstandingDebt : payment.change}
        pending={checkoutPending}
        onClose={() => setCheckoutOpen(false)}
        onPaymentMethodChange={setPaymentMethod}
        onAmountReceivedChange={setAmountReceived}
        onConfirm={doCheckout}
        onToast={setToast}
      />
    </div>
  );
}
