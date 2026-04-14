'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { useTranslation } from '@/i18n/useTranslation';

interface StockOpnameFormProps {
  productId: string | null;
  onProductChange: (id: string | null) => void;
  qty: number;
  onQtyChange: (qty: number) => void;
  note: string;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  pending: boolean;
}

export function StockOpnameForm({
  productId,
  onProductChange,
  qty,
  onQtyChange,
  note,
  onNoteChange,
  onSubmit,
  pending,
}: StockOpnameFormProps) {
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
        disabled={pending || !productId || qty < 0}
        onClick={onSubmit}
      >
        {pending ? t.stock.submitting : t.stock.submit}
      </Button>
    </div>
  );
}
