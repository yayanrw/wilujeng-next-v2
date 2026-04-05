"use client";

import { useEffect, useState } from "react";
import { formatIdr } from "@/utils/money";

type TransactionItem = {
  id: string;
  qty: number;
  priceAtTransaction: number;
  subtotal: number;
  productName: string | null;
  productSku: string | null;
};

type TransactionDetail = {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  status: string;
  createdAt: string;
  items: TransactionItem[];
};

export function SalesDetailModal({
  transactionId,
  onClose,
}: {
  transactionId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/transactions/${transactionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.error) setDetail(data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Transaction Detail</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900">
            Close
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-zinc-500">Loading...</div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-zinc-500">ID</span>
                <span className="font-mono">{detail.id}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Date</span>
                <span>{new Date(detail.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Status</span>
                <span className="capitalize">{detail.status}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Payment Method</span>
                <span className="capitalize">{detail.paymentMethod}</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Items</h3>
              <div className="overflow-x-auto rounded-md border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr className="border-b border-zinc-200 text-left text-zinc-500">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items?.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-zinc-500 font-mono">{item.productSku}</div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatIdr(item.priceAtTransaction)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.qty}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatIdr(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex w-48 justify-between">
                <span className="text-zinc-500">Total Amount:</span>
                <span className="font-medium tabular-nums">{formatIdr(detail.totalAmount)}</span>
              </div>
              <div className="flex w-48 justify-between">
                <span className="text-zinc-500">Amount Received:</span>
                <span className="tabular-nums">{formatIdr(detail.amountReceived)}</span>
              </div>
              <div className="flex w-48 justify-between">
                <span className="text-zinc-500">Change:</span>
                <span className="tabular-nums">{formatIdr(detail.change)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-red-500">Failed to load transaction</div>
        )}
      </div>
    </div>
  );
}