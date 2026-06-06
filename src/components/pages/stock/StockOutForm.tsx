'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { TransactionPicker } from '@/components/shared/TransactionPicker';
import { useTranslation } from '@/i18n/useTranslation';
import type { StockSubmitFn } from '@/hooks/useStockSubmit';

export function StockOutForm({
  submit,
  pending,
}: {
  submit: StockSubmitFn;
  pending: boolean;
}) {
  const { t } = useTranslation();

  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [outType, setOutType] = useState<'out' | 'return'>('out');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [note, setNote] = useState('');

  function reset() {
    setProductId(null);
    setQty(1);
    setOutType('out');
    setTransactionId(null);
    setReturnReason('');
    setNote('');
  }

  async function handleSubmit() {
    if (!productId) return;
    const isReturn = outType === 'return';
    const ok = await submit('/api/stock/out', {
      productId,
      qty,
      type: outType,
      note: note.trim() || undefined,
      transactionId: isReturn ? transactionId || undefined : undefined,
      returnReason: isReturn ? returnReason.trim() || undefined : undefined,
    });
    if (ok) reset();
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.stock.targetProduct}
        </label>
        <div className="mt-1.5">
          <ProductPicker value={productId} onChange={setProductId} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.stock.qty}
        </label>
        <Input
          className="mt-1.5 font-medium tabular-nums"
          inputMode="numeric"
          value={String(qty)}
          onChange={(e) =>
            setQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
          }
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.stock.outType}
        </label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="outType"
              value="out"
              checked={outType === 'out'}
              onChange={() => setOutType('out')}
              className="h-4 w-4 accent-zinc-900"
            />
            <span className="text-sm font-medium">{t.stock.outTypeDamaged}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="outType"
              value="return"
              checked={outType === 'return'}
              onChange={() => setOutType('return')}
              className="h-4 w-4 accent-zinc-900"
            />
            <span className="text-sm font-medium">{t.stock.outTypeReturn}</span>
          </label>
        </div>
      </div>

      {outType === 'return' && (
        <>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.originTransaction}
            </label>
            <div className="mt-1.5">
              <TransactionPicker
                value={transactionId}
                onChange={setTransactionId}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.returnReason}
            </label>
            <Input
              className="mt-1.5"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder={t.stock.returnReasonPlaceholder}
            />
          </div>
        </>
      )}

      <div className="md:col-span-2">
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

      <Button
        className="mt-8 h-12 w-full text-base font-semibold shadow-sm md:col-span-2"
        disabled={pending || !productId || qty < 1}
        onClick={handleSubmit}
      >
        {pending ? t.stock.submitting : t.stock.submit}
      </Button>
    </div>
  );
}
