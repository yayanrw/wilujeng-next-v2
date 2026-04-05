'use client';

import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { usePosStore } from '@/stores/posStore';
import { formatIdr } from '@/utils/money';

export function CartPanel({
  total,
  onCheckout,
}: {
  total: number;
  onCheckout: () => void;
}) {
  const items = usePosStore((s) => s.items);
  const setQty = usePosStore((s) => s.setQty);
  const removeItem = usePosStore((s) => s.removeItem);
  const clear = usePosStore((s) => s.clear);

  return (
    <Card className="flex flex-col h-full overflow-hidden border-zinc-200 shadow-sm">
      <CardHeader className="shrink-0 pb-4 border-b border-zinc-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
              <ShoppingCart className="h-4 w-4 text-zinc-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-none text-zinc-900">
                Current Order
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'} in cart
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
            onClick={clear}
            disabled={!items.length}
          >
            Clear All
          </Button>
        </div>
      </CardHeader>

      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-4 space-y-3 min-h-0 custom-scrollbar">
        {items.map((i) => (
          <div
            key={i.productId}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200/75 bg-white p-3 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-zinc-900 leading-tight line-clamp-2">
                  {i.name}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                    {i.sku}
                  </span>
                  <span>{formatIdr(i.unitPrice)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-sm tabular-nums text-zinc-900">
                  {formatIdr(i.subtotal)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-1">
              <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50/50">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors rounded-l-md active:bg-zinc-300"
                  onClick={() => setQty(i.productId, i.qty - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="w-10 text-center text-sm font-medium tabular-nums bg-white border-x border-zinc-200 flex items-center justify-center h-8">
                  {i.qty}
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors rounded-r-md active:bg-zinc-300"
                  onClick={() => setQty(i.productId, i.qty + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                className="flex h-8 items-center justify-center rounded-md px-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => removeItem(i.productId)}
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {!items.length ? (
          <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 mb-3">
              <ShoppingCart className="h-6 w-6 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-900">
              Your cart is empty
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
              Scan a barcode or select products from the list to start adding to
              your order.
            </p>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-zinc-200 bg-white p-4 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-zinc-500 font-medium">Total Amount</span>
          <span className="text-2xl font-bold tabular-nums text-zinc-900 tracking-tight">
            {formatIdr(total)}
          </span>
        </div>
        <Button
          className="w-full h-12 text-base font-semibold shadow-sm"
          disabled={!items.length}
          onClick={onCheckout}
        >
          Proceed to Checkout
        </Button>
      </div>
    </Card>
  );
}
