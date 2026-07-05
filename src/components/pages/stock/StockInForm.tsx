'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { SupplierPicker } from '@/components/shared/SupplierPicker';
import { useTranslation } from '@/i18n/useTranslation';
import { playSuccessSound, playFailSound } from '@/utils/sounds';
import type { StockSubmitFn } from '@/hooks/useStockSubmit';

export function StockInForm({
  submit,
  pending,
}: {
  submit: StockSubmitFn;
  pending: boolean;
}) {
  const { t } = useTranslation();

  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [unitBuyPrice, setUnitBuyPrice] = useState(0);
  const [supplierName, setSupplierName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const buyPriceRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  const canSave = !!productId && qty >= 1;

  async function handleSubmit() {
    setSubmitted(true);
    if (!canSave) return;
    const ok = await submit('/api/stock/in', {
      productId,
      qty,
      unitBuyPrice,
      supplierName: supplierName.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      note: note.trim() || undefined,
    });
    if (!ok) {
      playFailSound();
      return;
    }
    playSuccessSound();
    setProductId(null);
    setQty(1);
    setUnitBuyPrice(0);
    setSupplierName('');
    setExpiryDate('');
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
      {/* Loading progress bar — always reserves h-1 space, animates when pending */}
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
              buyPriceRef.current?.focus();
            }
          }}
        />
        {submitted && qty < 1 && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            {t.stock.qtyMin1}
          </p>
        )}
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
            ref={buyPriceRef}
            className="pl-9 font-medium tabular-nums"
            inputMode="numeric"
            value={unitBuyPrice ? String(unitBuyPrice) : ''}
            onChange={(e) =>
              setUnitBuyPrice(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                expiryRef.current?.focus();
              }
            }}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.dashboard.supplier}
        </label>
        <div className="mt-1.5">
          <SupplierPicker value={supplierName} onChange={setSupplierName} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.stock.expiryDate}
        </label>
        <Input
          ref={expiryRef}
          type="date"
          className="mt-1.5"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              noteRef.current?.focus();
            }
          }}
        />
      </div>

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
