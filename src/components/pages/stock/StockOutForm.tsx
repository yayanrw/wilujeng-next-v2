'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { TransactionPicker } from '@/components/shared/TransactionPicker';
import { useCatalogStore } from '@/stores/catalogStore';
import { useTranslation } from '@/i18n/useTranslation';
import { playSuccessSound, playFailSound } from '@/utils/sounds';
import type { StockSubmitFn } from '@/hooks/useStockSubmit';

export function StockOutForm({
  submit,
  pending,
}: {
  submit: StockSubmitFn;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const stocks = useCatalogStore((s) => s.stocks);

  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [outType, setOutType] = useState<'out' | 'return'>('out');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  const isReturn = outType === 'return';
  const currentStock =
    productId && productId in stocks ? stocks[productId] : null;
  const exceedsStock =
    !isReturn && currentStock !== null && qty > currentStock;

  const canSave =
    !!productId &&
    qty >= 1 &&
    !exceedsStock &&
    (!isReturn || !!transactionId);

  function reset() {
    setProductId(null);
    setQty(1);
    setOutType('out');
    setTransactionId(null);
    setReturnReason('');
    setNote('');
    setSubmitted(false);
  }

  async function handleSubmit() {
    setSubmitted(true);
    if (!canSave) return;
    const ok = await submit('/api/stock/out', {
      productId,
      qty,
      type: outType,
      note: note.trim() || undefined,
      transactionId: isReturn ? transactionId || undefined : undefined,
      returnReason: isReturn ? returnReason.trim() || undefined : undefined,
    });
    if (!ok) {
      playFailSound();
      return;
    }
    playSuccessSound();
    reset();
  }

  return (
    <form
      ref={formRef}
      className={`grid grid-cols-1 gap-6 md:grid-cols-2 transition-opacity duration-150${pending ? ' opacity-60 pointer-events-none' : ''}`}
      onKeyDown={(e) => {
        if (e.shiftKey && e.key === 'Enter') {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      }}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 md:col-span-2"
        style={{ opacity: pending ? 1 : 0 }}
      >
        <div className="h-full w-2/5 rounded-full bg-zinc-900 dark:bg-zinc-100 [animation:bar-slide_1.5s_ease-in-out_infinite]" />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.stock.targetProduct}
        </label>
        <div className="mt-1.5">
          <ProductPicker value={productId} onChange={setProductId} />
        </div>
        {productId && currentStock !== null && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {t.stock.currentStock}: {currentStock}
          </p>
        )}
        {submitted && !productId && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            {t.stock.productRequired}
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.stock.qty}
        </label>
        <Input
          ref={qtyRef}
          className="mt-1.5 font-medium tabular-nums"
          inputMode="numeric"
          value={String(qty)}
          onChange={(e) =>
            setQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (isReturn ? reasonRef : noteRef).current?.focus();
            }
          }}
        />
        {submitted && qty < 1 && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            {t.stock.qtyMin1}
          </p>
        )}
        {exceedsStock && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400 tabular-nums">
            {t.stock.qtyExceedsStock}: {currentStock}
          </p>
        )}
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

      {isReturn && (
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
            {submitted && !transactionId && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {t.stock.transactionRequired}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.returnReason}
            </label>
            <Input
              ref={reasonRef}
              className="mt-1.5"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  noteRef.current?.focus();
                }
              }}
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
          ref={noteRef}
          className="mt-1.5"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          placeholder={t.stock.optionalRemarks}
        />
      </div>

      <Button
        type="submit"
        className="mt-8 h-12 w-full text-base font-semibold shadow-sm md:col-span-2"
        disabled={pending || !canSave}
      >
        {pending ? t.stock.submitting : t.stock.submit}
      </Button>
    </form>
  );
}
