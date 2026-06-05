'use client';

import { useEffect, useState } from 'react';
import { PackagePlus, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';

export function QuickStockInModal({
  open,
  productId,
  productName,
  currentStock,
  currentBuyPrice,
  onSuccess,
  onClose,
}: {
  open: boolean;
  productId: string;
  productName: string;
  currentStock: number;
  currentBuyPrice: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [qty, setQty] = useState(1);
  const [unitBuyPrice, setUnitBuyPrice] = useState(currentBuyPrice);
  const [supplierName, setSupplierName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setQty(1);
      setUnitBuyPrice(currentBuyPrice);
      setSupplierName('');
      setExpiryDate('');
      setNote('');
      setError('');
    }
  }, [open, currentBuyPrice]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (qty <= 0) {
      setError(t.products.quickStockInQtyRequired);
      return;
    }
    setPending(true);
    setError('');
    try {
      const res = await fetch('/api/stock/in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId,
          qty,
          unitBuyPrice,
          supplierName: supplierName.trim() || undefined,
          expiryDate: expiryDate || undefined,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: { message?: string } } | null;
        setError(body?.error?.message ?? t.products.quickStockInFailed);
        return;
      }
      onSuccess();
    } catch {
      setError(t.products.quickStockInFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <PackagePlus className="h-4 w-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t.products.quickStockInTitle}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                {productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm border border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t.products.quickStockInCurrent}
            </span>
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {currentStock}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.qty} *
            </label>
            <Input
              className="mt-1.5 font-medium tabular-nums"
              inputMode="numeric"
              value={String(qty)}
              onChange={(e) =>
                setQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
              }
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.products.buyPrice}
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                Rp
              </span>
              <Input
                className="pl-9 font-medium tabular-nums"
                inputMode="numeric"
                value={unitBuyPrice ? String(unitBuyPrice) : ''}
                onChange={(e) =>
                  setUnitBuyPrice(
                    Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                  )
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.supplier}
            </label>
            <Input
              className="mt-1.5"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder={t.products.quickStockInSupplierPlaceholder}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.expiryDate}
            </label>
            <Input
              type="date"
              className="mt-1.5"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.notes}
            </label>
            <Input
              className="mt-1.5"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.stock.optionalRemarks}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={pending}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={pending || qty <= 0}
            >
              {pending ? t.common.saving : t.products.quickStockIn}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
