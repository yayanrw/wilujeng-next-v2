import { useState } from 'react';
import { HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalFrame } from '@/components/ui/ModalFrame';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

export function PayDebtModal({
  customerName,
  totalDebt,
  onClose,
  onSubmit,
}: {
  customerName: string;
  totalDebt: number;
  onClose: () => void;
  onSubmit: (amount: number, method: string, note: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(totalDebt);
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  return (
    <ModalFrame
      title={t.customers.payDebt}
      icon={<HandCoins className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="sm"
      zIndex={200}
    >
      <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.dashboard.customer}
            </label>
            <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
              {customerName}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.customers.totalOutstanding}
            </label>
            <div className="mt-1 font-medium text-red-600 dark:text-red-400">
              {formatIdr(totalDebt)}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.customers.paymentAmount}
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                Rp
              </span>
              <Input
                className="pl-9 font-medium tabular-nums"
                inputMode="numeric"
                value={amount ? formatIdr(amount).replace('Rp', '').trim() : ''}
                onChange={(e) =>
                  setAmount(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                }
              />
            </div>
            {amount > totalDebt && (
              <p className="mt-1 text-xs text-red-600">
                {t.customers.amountExceedsDebt}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.pos.paymentMethod}
            </label>
            <select
              className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="cash">{t.pos.cash}</option>
              <option value="transfer">{t.pos.transfer}</option>
              <option value="qris">{t.pos.qris}</option>
              <option value="card">Card</option>
            </select>
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

        <div className="border-t border-zinc-200 dark:border-zinc-800 mt-6 pt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button
            disabled={loading || amount <= 0 || amount > totalDebt}
            onClick={async () => {
              setLoading(true);
              try {
                await onSubmit(amount, method, note);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? t.pos.processing : t.customers.confirmPayment}
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}
