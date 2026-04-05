"use client";

import { formatIdr } from "@/utils/money";
import { Package, ArrowRightLeft, X } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stock Log Detail</h2>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Log ID</span>
              <span className="font-mono text-sm">{log.id}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Date</span>
              <span className="text-sm">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Type</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide mt-1 ${
                log.type === 'in' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                log.type === 'out' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {log.type}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Product</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{log.productName || "-"}</span>
              <span className="block text-xs font-mono text-zinc-500 dark:text-zinc-400">{log.productSku || "-"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 flex items-center justify-between">
            <div className="text-center flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Previous</span>
              <span className="text-2xl tabular-nums font-medium text-zinc-600 dark:text-zinc-300">{log.prevStock}</span>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 px-4">
              <span className={`text-xl tabular-nums font-bold ${log.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : log.type === 'out' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {log.type === 'in' ? '+' : log.type === 'out' ? '-' : ''}{log.qty}
              </span>
              <ArrowRightLeft className="h-4 w-4 text-zinc-300 dark:text-zinc-700 mt-1" />
            </div>
            <div className="text-center flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">New Balance</span>
              <span className="text-2xl tabular-nums font-bold text-zinc-900 dark:text-zinc-100">{log.nextStock}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
            {log.unitBuyPrice !== null && (
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Unit Buy Price</span>
                <span className="tabular-nums font-medium text-sm mt-1 block">{formatIdr(log.unitBuyPrice)}</span>
              </div>
            )}
            {log.supplierId && (
              <div className="col-span-2 md:col-span-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Supplier ID</span>
                <span className="font-mono text-xs mt-1 block">{log.supplierId}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Note</span>
              <div className="mt-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 min-h-[60px] text-sm text-zinc-700 dark:text-zinc-300">
                {log.note || <span className="text-zinc-400 dark:text-zinc-600 italic">No note provided</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}