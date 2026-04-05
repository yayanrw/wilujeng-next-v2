import { useState } from 'react';
import { HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  onSubmit: (amount: number, method: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(totalDebt);
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t.customers.payDebt}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 hover:text-zinc-600 dark:text-zinc-400"
            onClick={onClose}
          >
            <span className="sr-only">{t.common.cancel}</span>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
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
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button
            disabled={loading || amount <= 0 || amount > totalDebt}
            onClick={async () => {
              setLoading(true);
              try {
                await onSubmit(amount, method);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? t.pos.processing : t.customers.confirmPayment}
          </Button>
        </div>
      </div>
    </div>
  );
}
