'use client';

import { useRef, useState } from 'react';
import { Camera, Trash } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { SupplierPicker } from '@/components/shared/SupplierPicker';
import { BarcodeScannerModal } from '@/components/pages/pos/BarcodeScannerModal';
import { useCatalogStore } from '@/stores/catalogStore';
import { useTranslation } from '@/i18n/useTranslation';
import { playSuccessSound, playFailSound } from '@/utils/sounds';
import type { StockSubmitFn } from '@/hooks/useStockSubmit';

type Row = {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unitBuyPrice: number;
  expiryDate: string;
  showExpiry: boolean;
};

export function StockInForm({
  submit,
  pending,
}: {
  submit: StockSubmitFn;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const products = useCatalogStore((s) => s.products);

  const [rows, setRows] = useState<Row[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  const canSave = rows.length > 0;
  const totalQty = rows.reduce((sum, r) => sum + r.qty, 0);

  function addOrBumpRow(productId: string) {
    setRows((prev) => {
      const existing = prev.find((r) => r.productId === productId);
      if (existing) {
        return prev.map((r) =>
          r.productId === productId ? { ...r, qty: r.qty + 1 } : r,
        );
      }
      const product = products.find((p) => p.id === productId);
      if (!product) return prev;
      return [
        ...prev,
        {
          productId,
          sku: product.sku,
          name: product.name,
          qty: 1,
          unitBuyPrice: product.buyPrice,
          expiryDate: '',
          showExpiry: false,
        },
      ];
    });
  }

  function addOrBumpRowBySku(sku: string) {
    const product = products.find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase(),
    );
    if (product) addOrBumpRow(product.id);
  }

  function updateRow(productId: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, ...patch } : r)),
    );
  }

  function removeRow(productId: string) {
    setRows((prev) => prev.filter((r) => r.productId !== productId));
  }

  async function handleSubmit() {
    setSubmitted(true);
    if (!canSave) return;
    const ok = await submit('/api/stock/in/bulk', {
      items: rows.map((r) => ({
        productId: r.productId,
        qty: r.qty,
        unitBuyPrice: r.unitBuyPrice,
        expiryDate: r.expiryDate.trim() || undefined,
      })),
      supplierName: supplierName.trim() || undefined,
      note: note.trim() || undefined,
    });
    if (!ok) {
      playFailSound();
      return;
    }
    playSuccessSound();
    setRows([]);
    setSupplierName('');
    setNote('');
    setSubmitted(false);
  }

  return (
    <form
      ref={formRef}
      className={`flex flex-col gap-6 transition-opacity duration-150${pending ? ' opacity-60 pointer-events-none' : ''}`}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (e.shiftKey) formRef.current?.requestSubmit();
      }}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      {/* Loading progress bar — always reserves h-1 space, animates when pending */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        style={{ opacity: pending ? 1 : 0 }}
      >
        <div className="h-full w-2/5 rounded-full bg-zinc-900 dark:bg-zinc-100 [animation:bar-slide_1.5s_ease-in-out_infinite]" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            {t.stock.notes}
          </label>
          <Input
            ref={noteRef}
            className="mt-1.5"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.stock.optionalRemarks}
          />
        </div>
      </div>

      <div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.scanOrSearch}
            </label>
            <div className="mt-1.5">
              <ProductPicker value={null} onChange={(id) => id && addOrBumpRow(id)} />
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="h-10 w-10 shrink-0 p-0"
            title={t.stock.scanBarcode}
            onClick={() => setScannerOpen(true)}
          >
            <Camera className="h-4 w-4" />
            <span className="sr-only">{t.stock.scanBarcode}</span>
          </Button>
        </div>
        {submitted && !canSave && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            {t.stock.bulkEmpty}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.productId}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {row.sku}
                  </div>
                </div>

                <Input
                  className="w-20 text-center font-medium tabular-nums"
                  inputMode="numeric"
                  value={String(row.qty)}
                  onChange={(e) =>
                    updateRow(row.productId, {
                      qty: Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                    })
                  }
                  onFocus={(e) => e.target.select()}
                />

                <div className="relative w-28 shrink-0">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-medium">
                    Rp
                  </span>
                  <Input
                    className="pl-7 font-medium tabular-nums"
                    inputMode="numeric"
                    value={row.unitBuyPrice ? String(row.unitBuyPrice) : ''}
                    onChange={(e) =>
                      updateRow(row.productId, {
                        unitBuyPrice:
                          Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                      })
                    }
                    onFocus={(e) => e.target.select()}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  onClick={() => removeRow(row.productId)}
                  title={t.stock.removeRow}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">{t.stock.removeRow}</span>
                </Button>
              </div>

              {row.showExpiry ? (
                <Input
                  type="date"
                  className="w-44"
                  value={row.expiryDate}
                  onChange={(e) =>
                    updateRow(row.productId, { expiryDate: e.target.value })
                  }
                />
              ) : (
                <button
                  type="button"
                  className="self-start text-xs text-zinc-500 dark:text-zinc-400 underline-offset-2 hover:underline"
                  onClick={() =>
                    updateRow(row.productId, { showExpiry: true })
                  }
                >
                  {t.stock.showExpiry}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
          {rows.length} {t.stock.productsCount} · {totalQty} {t.stock.unitsCount}
        </span>
        <Button
          type="submit"
          className="h-12 flex-1 text-base font-semibold shadow-sm"
          disabled={pending || !canSave}
        >
          {pending ? t.stock.submitting : t.stock.bulkSubmit}
        </Button>
      </div>

      <BarcodeScannerModal
        open={scannerOpen}
        onScan={(sku) => addOrBumpRowBySku(sku)}
        onClose={() => setScannerOpen(false)}
      />
    </form>
  );
}
