'use client';

import { useEffect, useState } from 'react';
import { User, Wallet, AlertCircle, RefreshCw, HandCoins } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomerPicker } from '@/components/shared/CustomerPicker';
import { usePosStore } from '@/stores/posStore';
import type { PaymentMethod } from '@/utils/checkout';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

function CustomerDebtPayButton({
  customerId,
  onToast,
  debtPaymentAmount,
  onDebtPaymentAmountChange,
}: {
  customerId: string;
  onToast: (m: string) => void;
  debtPaymentAmount?: number;
  onDebtPaymentAmountChange?: (n: number) => void;
}) {
  const [debt, setDebt] = useState<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/customers/${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.customer?.totalDebt > 0) {
          setDebt(data.customer.totalDebt);
        } else if (!cancelled) {
          setDebt(0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (debt === null || debt <= 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <div>
          <div className="text-xs font-semibold text-red-800 dark:text-red-200">
            {t.pos.outstandingDebt}
          </div>
          <div className="text-sm font-bold text-red-900 dark:text-red-100">
            {formatIdr(debt)}
          </div>
        </div>
      </div>
      {onDebtPaymentAmountChange && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-red-700 dark:text-red-300">
            {t.pos.payRp}
          </span>
          <Input
            className="pl-14 h-9 text-sm font-medium tracking-tight bg-white dark:bg-zinc-950 border-red-200 dark:border-red-800/50 focus-visible:ring-red-500"
            inputMode="numeric"
            value={
              debtPaymentAmount
                ? formatIdr(debtPaymentAmount).replace('Rp', '').trim()
                : ''
            }
            onChange={(e) => {
              const val = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
              if (val > debt) {
                onToast(t.customers.amountExceedsDebt);
                onDebtPaymentAmountChange(debt);
              } else {
                onDebtPaymentAmountChange(val);
              }
            }}
            placeholder="0"
          />
        </div>
      )}
    </div>
  );
}

export function CheckoutModal({
  open,
  total,
  paymentMethod,
  amountReceived,
  paymentStatus,
  outstandingOrChange,
  pending,
  onClose,
  onPaymentMethodChange,
  onAmountReceivedChange,
  onConfirm,
  onToast,
  debtPaymentAmount,
  onDebtPaymentAmountChange,
}: {
  open: boolean;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  paymentStatus: 'paid' | 'debt';
  outstandingOrChange: number;
  pending: boolean;
  onClose: () => void;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onAmountReceivedChange: (n: number) => void;
  onConfirm: () => void;
  onToast: (m: string) => void;
  debtPaymentAmount?: number;
  onDebtPaymentAmountChange?: (n: number) => void;
}) {
  const customerId = usePosStore((s) => s.customerId);
  const setCustomerId = usePosStore((s) => s.setCustomerId);

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    setNewCustomerName('');
    setNewCustomerPhone('');
    setIsCreatingCustomer(false);
  }, [open]);

  async function createCustomerQuick() {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: newCustomerName, phone: newCustomerPhone }),
    });
    const body = (await res.json().catch(() => null)) as
      | { id: string }
      | { error: { message: string } }
      | null;
    if (!res.ok) {
      throw new Error(
        body && 'error' in body
          ? body.error.message
          : t.customers.failedToCreate,
      );
    }
    if (!body || !('id' in body)) throw new Error(t.customers.failedToCreate);
    setCustomerId(body.id);
    setNewCustomerName('');
    setNewCustomerPhone('');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t.pos.checkoutTitle}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 hover:text-zinc-600 dark:text-zinc-400"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
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

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Customer Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                {t.dashboard.customer}
              </label>
              {!customerId && !isCreatingCustomer && (
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => setIsCreatingCustomer(true)}
                >
                  + {t.customers.newCustomer}
                </button>
              )}
              {isCreatingCustomer && (
                <button
                  type="button"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300"
                  onClick={() => setIsCreatingCustomer(false)}
                >
                  {t.common.cancel}
                </button>
              )}
            </div>

            {isCreatingCustomer ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-blue-900">
                      {t.customers.name}
                    </label>
                    <Input
                      className="mt-1 bg-white dark:bg-zinc-950 border-blue-200 focus-visible:ring-blue-500"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-blue-900">
                      {t.customers.phone}
                    </label>
                    <Input
                      className="mt-1 bg-white dark:bg-zinc-950 border-blue-200 focus-visible:ring-blue-500"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="0812..."
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:text-zinc-900"
                  disabled={!newCustomerName.trim()}
                  onClick={async () => {
                    try {
                      await createCustomerQuick();
                      onToast(t.customers.customerCreatedAndSelected);
                      setIsCreatingCustomer(false);
                    } catch (e) {
                      onToast(
                        e instanceof Error
                          ? e.message
                          : t.customers.failedToCreate,
                      );
                    }
                  }}
                >
                  {t.common.save} {t.dashboard.customer}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <CustomerPicker value={customerId} onChange={setCustomerId} />
                {customerId && (
                  <CustomerDebtPayButton
                    customerId={customerId}
                    onToast={onToast}
                    debtPaymentAmount={debtPaymentAmount}
                    onDebtPaymentAmountChange={onDebtPaymentAmountChange}
                  />
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Payment Method Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t.pos.paymentMethod}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['cash', 'qris', 'transfer', 'debt'] as PaymentMethod[]).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    className={`relative overflow-hidden rounded-xl border p-3 text-center text-sm transition-all duration-200 ${
                      m === paymentMethod
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
                    }`}
                    onClick={() => onPaymentMethodChange(m)}
                  >
                    <span className="relative z-10 font-medium uppercase tracking-wider text-xs">
                      {t.pos[m as keyof typeof t.pos]}
                    </span>
                  </button>
                ),
              )}
            </div>

            {paymentMethod === 'debt' && !customerId && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 animate-in fade-in duration-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{t.pos.selectCustomerForDebt}</p>
              </div>
            )}
          </div>

          {/* Amount Received Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {t.pos.amountReceived}
              </label>
              {amountReceived > 0 && (
                <button
                  type="button"
                  onClick={() => onAmountReceivedChange(0)}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300"
                >
                  <RefreshCw className="h-3 w-3" />
                  {t.customers.reset}
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">
                Rp
              </span>
              <Input
                className="pl-9 h-12 text-lg font-medium tracking-tight"
                inputMode="numeric"
                value={
                  amountReceived
                    ? formatIdr(amountReceived).replace('Rp', '').trim()
                    : ''
                }
                onChange={(e) =>
                  onAmountReceivedChange(
                    Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                  )
                }
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1000, 2000, 5000, 10000, 20000, 50000, 100000].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-100"
                  onClick={() => onAmountReceivedChange(amountReceived + v)}
                >
                  +{formatIdr(v).replace('Rp', '').trim()}
                </button>
              ))}
              <button
                type="button"
                className="col-span-4 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                onClick={() => onAmountReceivedChange(total)}
              >
                {t.pos.exactAmount} ({formatIdr(total)})
              </button>
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-100 p-4">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {t.pos.total}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatIdr(total)}
              </div>
            </div>
            <div
              className={`rounded-xl p-4 ${
                paymentStatus === 'debt'
                  ? 'bg-red-50 text-red-900'
                  : outstandingOrChange > 0
                    ? 'bg-green-50 text-green-900'
                    : 'bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-100 text-zinc-900 dark:text-zinc-50'
              }`}
            >
              <div
                className={`text-xs font-medium uppercase tracking-wider ${
                  paymentStatus === 'debt'
                    ? 'text-red-600'
                    : outstandingOrChange > 0
                      ? 'text-green-600'
                      : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {paymentStatus === 'debt'
                  ? t.pos.outstandingDebt
                  : t.pos.change}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight">
                {formatIdr(outstandingOrChange)}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Button
            className="w-full h-12 text-base font-semibold shadow-sm"
            onClick={onConfirm}
            disabled={pending || (paymentMethod === 'debt' && !customerId)}
          >
            {pending ? t.pos.processing : t.pos.confirmPayment}
          </Button>
        </div>
      </div>
    </div>
  );
}
