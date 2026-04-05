"use client";

import { formatIdr } from "@/utils/money";

type StockLog = {
  id: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  type: string;
  qty: number;
  prevStock: number;
  nextStock: number;
  note: string | null;
  supplierId: string | null;
  unitBuyPrice: number | null;
  createdAt: string;
};

export function StockLogDetailModal({
  log,
  onClose,
}: {
  log: StockLog;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-zinc-950 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Stock Log Detail</h2>
          <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-50">
            Close
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-zinc-500 dark:text-zinc-400">ID</span>
              <span className="font-mono">{log.id}</span>
            </div>
            <div>
              <span className="block text-zinc-500 dark:text-zinc-400">Date</span>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-zinc-500 dark:text-zinc-400">Type</span>
              <span className="uppercase font-semibold">{log.type}</span>
            </div>
            <div>
              <span className="block text-zinc-500 dark:text-zinc-400">Product</span>
              <span className="font-medium">{log.productName || "-"}</span>
              <span className="block text-xs font-mono text-zinc-500 dark:text-zinc-400">{log.productSku || "-"}</span>
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-100 p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Previous Stock</span>
              <span className="text-lg tabular-nums text-zinc-500 dark:text-zinc-400">{log.prevStock}</span>
            </div>
            <div>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Change (Qty)</span>
              <span className={`text-lg tabular-nums font-semibold ${log.type === 'in' ? 'text-green-600' : log.type === 'out' ? 'text-red-600' : 'text-blue-600'}`}>
                {log.type === 'in' ? '+' : log.type === 'out' ? '-' : ''}{log.qty}
              </span>
            </div>
            <div>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">New Stock</span>
              <span className="text-lg tabular-nums font-bold">{log.nextStock}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
            {log.unitBuyPrice !== null && (
              <div>
                <span className="block text-zinc-500 dark:text-zinc-400">Unit Buy Price</span>
                <span className="tabular-nums font-medium">{formatIdr(log.unitBuyPrice)}</span>
              </div>
            )}
            {log.supplierId && (
              <div className="col-span-2 md:col-span-1">
                <span className="block text-zinc-500 dark:text-zinc-400">Supplier ID</span>
                <span className="font-mono text-xs">{log.supplierId}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="block text-zinc-500 dark:text-zinc-400">Note</span>
              <div className="mt-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 min-h-[60px]">
                {log.note || <span className="text-zinc-400 italic">No note provided</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}