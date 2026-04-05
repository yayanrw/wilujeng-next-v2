"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { usePosStore } from "@/stores/posStore";
import { formatIdr } from "@/utils/money";

export function CartPanel({ total, onCheckout }: { total: number; onCheckout: () => void }) {
  const items = usePosStore((s) => s.items);
  const setQty = usePosStore((s) => s.setQty);
  const removeItem = usePosStore((s) => s.removeItem);
  const clear = usePosStore((s) => s.clear);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Cart</div>
            <div className="text-xs text-zinc-500">Adjust qty and checkout</div>
          </div>
          <Button variant="ghost" onClick={clear} disabled={!items.length}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex max-h-[52vh] flex-col gap-2 overflow-auto pr-1">
          {items.map((i) => (
            <div
              key={i.productId}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{i.name}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge>{i.sku}</Badge>
                  <span className="text-xs text-zinc-500 tabular-nums">{formatIdr(i.unitPrice)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-md border border-zinc-200 hover:bg-zinc-50"
                  onClick={() => setQty(i.productId, i.qty - 1)}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-10 text-center text-sm tabular-nums">{i.qty}</div>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-md border border-zinc-200 hover:bg-zinc-50"
                  onClick={() => setQty(i.productId, i.qty + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-md border border-zinc-200 hover:bg-zinc-50"
                  onClick={() => removeItem(i.productId)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="w-28 text-right text-sm font-semibold tabular-nums">{formatIdr(i.subtotal)}</div>
            </div>
          ))}
          {!items.length ? (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
              Add products to begin
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
          <div className="text-sm text-zinc-500">Total</div>
          <div className="text-xl font-semibold tabular-nums">{formatIdr(total)}</div>
        </div>
        <Button className="mt-3 w-full" disabled={!items.length} onClick={onCheckout}>
          Checkout
        </Button>
      </CardContent>
    </Card>
  );
}

