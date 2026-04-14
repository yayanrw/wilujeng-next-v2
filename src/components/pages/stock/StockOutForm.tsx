'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { TransactionPicker } from '@/components/shared/TransactionPicker';
import { useTranslation } from '@/i18n/useTranslation';

interface StockOutFormProps {
  productId: string | null;
  onProductChange: (id: string | null) => void;
  qty: number;
  onQtyChange: (qty: number) => void;
  outType: 'out' | 'return';
  onOutTypeChange: (type: 'out' | 'return') => void;
  transactionId: string | null;
  onTransactionIdChange: (id: string | null) => void;
  returnReason: string;
  onReturnReasonChange: (reason: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  pending: boolean;
}

export function StockOutForm({
  productId,
  onProductChange,
  qty,
  onQtyChange,
  outType,
  onOutTypeChange,
  transactionId,
  onTransactionIdChange,
  returnReason,
  onReturnReasonChange,
  note,
  onNoteChange,
  onSubmit,
  pending,
}: StockOutFormProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.stock.targetProduct}
        </label>
        <div className="mt-1.5">
          <ProductPicker value={productId} onChange={onProductChange} />
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
            onQtyChange(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
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
              onChange={() => onOutTypeChange('out')}
              className="h-4 w-4 accent-zinc-900"
            />
            <span className="text-sm font-medium">
              {t.stock.outTypeDamaged}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="outType"
              value="return"
              checked={outType === 'return'}
              onChange={() => onOutTypeChange('return')}
              className="h-4 w-4 accent-zinc-900"
            />
            <span className="text-sm font-medium">
              {t.stock.outTypeReturn}
            </span>
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
                onChange={onTransactionIdChange}
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
              onChange={(e) => onReturnReasonChange(e.target.value)}
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
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t.stock.optionalRemarks}
        />
      </div>

      <Button
        className="mt-8 h-12 w-full text-base font-semibold shadow-sm md:col-span-2"
        disabled={pending || !productId || qty < 1}
        onClick={onSubmit}
      >
        {pending ? t.stock.submitting : t.stock.submit}
      </Button>
    </div>
  );
}
