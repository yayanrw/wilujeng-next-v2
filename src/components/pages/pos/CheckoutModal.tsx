"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePosStore } from "@/stores/posStore";
import type { PaymentMethod } from "@/utils/checkout";
import { formatIdr } from "@/utils/money";

type CustomerLite = {
  id: string;
  name: string;
  phone?: string | null;
  totalDebt: number;
  points: number;
};

export function CheckoutModal({
  open,
  total,
  paymentMethod,
  amountReceived,
  paymentStatus,
  outstandingOrChange,
  pending,
  onClose,
  onPaymentMethodChange,
  onAmountReceivedChange,
  onConfirm,
  onToast,
}: {
  open: boolean;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  paymentStatus: "paid" | "debt";
  outstandingOrChange: number;
  pending: boolean;
  onClose: () => void;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onAmountReceivedChange: (n: number) => void;
  onConfirm: () => void;
  onToast: (m: string) => void;
}) {
  const customerId = usePosStore((s) => s.customerId);
  const setCustomerId = usePosStore((s) => s.setCustomerId);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setCustomerQuery("");
    setCustomers([]);
  }, [open]);

  useEffect(() => {
    const q = customerQuery.trim();
    if (!q) {
      setCustomers([]);
      return;
    }

    let cancelled = false;
    void fetch(`/api/customers?search=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d: CustomerLite[]) => {
        if (!cancelled) setCustomers(d);
      });

    return () => {
      cancelled = true;
    };
  }, [customerQuery]);

  async function createCustomerQuick() {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newCustomerName, phone: newCustomerPhone }),
    });
    const body = (await res.json().catch(() => null)) as
      | { id: string }
      | { error: { message: string } }
      | null;
    if (!res.ok) {
      throw new Error(body && "error" in body ? body.error.message : "Failed to create customer");
    }
    if (!body || !("id" in body)) throw new Error("Failed to create customer");
    setCustomerId(body.id);
    setCustomerQuery("");
    setCustomers([]);
    setNewCustomerName("");
    setNewCustomerPhone("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Checkout</div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["cash", "qris", "transfer", "debt"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              className={
                m === paymentMethod
                  ? "rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white"
                  : "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              }
              onClick={() => onPaymentMethodChange(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium">Amount received</label>
          <Input
            inputMode="numeric"
            value={amountReceived ? String(amountReceived) : ""}
            onChange={(e) => onAmountReceivedChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
            placeholder="0"
          />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[2000, 5000, 10000, 20000, 50000, 100000].map((v) => (
              <Button key={v} variant="secondary" size="sm" onClick={() => onAmountReceivedChange(amountReceived + v)}>
                {formatIdr(v)}
              </Button>
            ))}
            <Button variant="secondary" size="sm" onClick={() => onAmountReceivedChange(total)}>
              Exact
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Total</div>
            <div className="mt-1 text-sm font-semibold tabular-nums">{formatIdr(total)}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">{paymentStatus === "debt" ? "Outstanding" : "Change"}</div>
            <div className="mt-1 text-sm font-semibold tabular-nums">{formatIdr(outstandingOrChange)}</div>
          </div>
        </div>

        {paymentStatus === "debt" ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="text-sm font-semibold text-amber-900">Customer required</div>
            <div className="mt-1 text-sm text-amber-800">Select an existing customer or create a new one.</div>

            <div className="mt-3">
              <label className="text-sm font-medium">Search customers</label>
              <Input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Name or phone"
              />
              <div className="mt-2 max-h-32 overflow-auto rounded-lg border border-amber-200 bg-white">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={
                      c.id === customerId
                        ? "flex w-full items-center justify-between gap-2 border-b border-amber-100 bg-amber-100 px-3 py-2 text-left text-sm"
                        : "flex w-full items-center justify-between gap-2 border-b border-amber-100 px-3 py-2 text-left text-sm hover:bg-amber-50"
                    }
                    onClick={() => setCustomerId(c.id)}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-xs text-amber-900 tabular-nums">{formatIdr(c.totalDebt)}</span>
                  </button>
                ))}
                {!customers.length && customerQuery.trim() ? (
                  <div className="px-3 py-2 text-sm text-amber-800">No customers found</div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">New customer name</label>
                <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} />
              </div>
            </div>
            <Button
              className="mt-2 w-full"
              variant="secondary"
              disabled={!newCustomerName.trim()}
              onClick={async () => {
                try {
                  await createCustomerQuick();
                  onToast("Customer created");
                } catch (e) {
                  onToast(e instanceof Error ? e.message : "Failed to create customer");
                }
              }}
            >
              Create customer
            </Button>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? "Processing..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
