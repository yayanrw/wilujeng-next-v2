'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { useCatalogStore } from '@/stores/catalogStore';
import { useTranslation } from '@/i18n/useTranslation';
import { playSuccessSound, playFailSound } from '@/utils/sounds';
import type { StockSubmitFn } from '@/hooks/useStockSubmit';

export function StockOpnameForm({
  submit,
  pending,
}: {
  submit: StockSubmitFn;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const stocks = useCatalogStore((s) => s.stocks);

  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  const systemStock =
    productId && productId in stocks ? stocks[productId] : null;
  const diff = systemStock !== null ? qty - systemStock : null;

  const canSave = !!productId && qty >= 0;

  // Prefill qty with system stock when a product is picked, then focus qty.
  function handleProductChange(id: string | null) {
    setProductId(id);
    if (id && id in stocks) {
      setQty(stocks[id]);
      setTimeout(() => qtyRef.current?.focus(), 0);
    }
  }

  async function handleSubmit() {
    setSubmitted(true);
    if (!canSave) return;
    const ok = await submit('/api/stock/opname', {
      productId,
      qty,
      note: note.trim() || undefined,
    });
    if (!ok) {
      playFailSound();
      return;
    }
    playSuccessSound();
    setProductId(null);
    setQty(0);
    setNote('');
    setSubmitted(false);
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
          <ProductPicker value={productId} onChange={handleProductChange} />
        </div>
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
              noteRef.current?.focus();
            }
          }}
        />
      </div>

      {systemStock !== null && (
        <div className="flex items-end">
          <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">
                {t.stock.systemStock}
              </span>
              <span className="font-semibold tabular-nums">{systemStock}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">
                {t.stock.difference}
              </span>
              {diff === 0 ? (
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-semibold text-zinc-600 dark:text-zinc-300">
                  {t.stock.noDifference}
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold tabular-nums ${
                    (diff ?? 0) > 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {(diff ?? 0) > 0 ? '+' : ''}
                  {diff}
                </span>
              )}
            </div>
          </div>
        </div>
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
