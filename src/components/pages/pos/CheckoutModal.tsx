'use client';

import { useEffect, useRef } from 'react';
import { User, Wallet, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomerPicker } from '@/components/shared/CustomerPicker';
import { usePosStore } from '@/stores/posStore';
import { useCustomerStore } from '@/stores/customerStore';
import type { PaymentMethod } from '@/utils/checkout';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

function CustomerDebtPayButton({
  customerId,
  onToast,
  debtPaymentAmount,
  onDebtPaymentAmountChange,
  debtPaymentNote,
  onDebtPaymentNoteChange,
}: {
  customerId: string;
  onToast: (m: string) => void;
  debtPaymentAmount?: number;
  onDebtPaymentAmountChange?: (n: number) => void;
  debtPaymentNote?: string;
  onDebtPaymentNoteChange?: (s: string) => void;
}) {
  const customers = useCustomerStore((s) => s.customers);
  const debt = customers.find((c) => c.id === customerId)?.totalDebt ?? 0;
  const { t } = useTranslation();

  if (debt <= 0) return null;

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
            value={debtPaymentAmount ? formatIdr(debtPaymentAmount).replace('Rp', '').trim() : ''}
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
      {onDebtPaymentNoteChange && (
        <div className="relative">
          <Input
            className="h-9 text-sm font-medium tracking-tight bg-white dark:bg-zinc-950 border-red-200 dark:border-red-800/50 focus-visible:ring-red-500"
            value={debtPaymentNote ?? ''}
            onChange={(e) => onDebtPaymentNoteChange(e.target.value)}
            placeholder={t.customers?.paymentNotePlaceholder ?? 'Catatan (opsional)'}
          />
        </div>
      )}
    </div>
  );
}

const PAYMENT_METHODS = ['cash', 'qris', 'transfer', 'debt'] as const;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 4)}••••${digits.slice(-4)}`;
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
  debtPaymentNote,
  onDebtPaymentNoteChange,
  sendWhatsapp,
  onSendWhatsappChange,
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
  debtPaymentNote?: string;
  onDebtPaymentNoteChange?: (s: string) => void;
  sendWhatsapp?: boolean;
  onSendWhatsappChange?: (v: boolean) => void;
}) {
  const customerId = usePosStore((s) => s.customerId);
  const setCustomerId = usePosStore((s) => s.setCustomerId);
  const addCustomer = useCustomerStore((s) => s.addCustomer);
  const customers = useCustomerStore((s) => s.customers);
  const customerPhone = customers.find((c) => c.id === customerId)?.phone ?? null;

  const amountInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerSectionRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const waToggleRef = useRef<HTMLButtonElement>(null);

  const { t } = useTranslation();

  // Auto-focus when modal opens: amount input for cash, otherwise the modal
  // container so Enter-to-confirm works without a double-submit on a button.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(
      () => (amountInputRef.current ?? modalContentRef.current)?.focus(),
      50,
    );
    return () => clearTimeout(timer);
  }, [open]);

  // Local keyboard shortcuts: Alt+1 customer, Alt+2-5 payment methods, Alt+6 amount, Enter confirm
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey) {
        if (e.key === '1') { e.preventDefault(); customerInputRef.current?.focus(); return; }
        if (e.key === '2') { e.preventDefault(); onPaymentMethodChange('cash'); return; }
        if (e.key === '3') { e.preventDefault(); onPaymentMethodChange('qris'); return; }
        if (e.key === '4') { e.preventDefault(); onPaymentMethodChange('transfer'); return; }
        if (e.key === '5') { e.preventDefault(); onPaymentMethodChange('debt'); return; }
        if (e.key === '6') { e.preventDefault(); amountInputRef.current?.focus(); return; }
        if (e.key === '7' && onSendWhatsappChange) { e.preventDefault(); onSendWhatsappChange(!sendWhatsapp); return; }
      }
      // Plain Enter confirms — but only when focus is already inside the modal.
      // This prevents the keystroke that OPENED the modal (focus is still on the
      // POS search bar at that instant) from immediately confirming the payment.
      // Auto-repeat (holding Enter) is ignored, the customer picker keeps its own
      // Enter for selecting/creating a customer, and the WA toggle keeps its own
      // Enter/Space for flipping instead of submitting the sale.
      if (e.key === 'Enter' && !e.shiftKey) {
        if (e.repeat) return;
        const active = document.activeElement;
        if (active === customerInputRef.current) return;
        if (active === waToggleRef.current) return;
        if (!modalContentRef.current?.contains(active)) return;
        e.preventDefault();
        if (!pending) onConfirm();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, pending, onPaymentMethodChange, onConfirm, sendWhatsapp, onSendWhatsappChange]);

  async function handleCreateCustomer(name: string) {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const body = (await res.json().catch(() => null)) as
      | { id: string }
      | { error: { message: string } }
      | null;
    if (!res.ok) {
      onToast(body && 'error' in body ? body.error.message : t.customers.failedToCreate);
      return;
    }
    if (!body || !('id' in body)) { onToast(t.customers.failedToCreate); return; }
    setCustomerId(body.id);
    addCustomer({ id: body.id, name, phone: null, totalDebt: 0 });
    onToast(t.customers.customerCreatedAndSelected);
  }

  if (!open) return null;

  const showAmountSection = paymentMethod === 'cash';
  const showChangeCard = paymentMethod === 'cash' || paymentMethod === 'debt';

  const confirmLabel = (() => {
    if (pending) return t.pos.processing;
    if (paymentMethod === 'debt') return `${t.pos.confirmPayment} · ${t.pos.debt}`;
    if (paymentMethod !== 'cash') return `${t.pos.confirmPayment} · ${formatIdr(total)}`;
    if (paymentStatus === 'paid' && outstandingOrChange > 0) {
      return `${t.pos.confirmPayment} · ${t.pos.change} ${formatIdr(outstandingOrChange)}`;
    }
    return t.pos.confirmPayment;
  })();

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalContentRef}
        tabIndex={-1}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading progress bar — always reserves h-1 space, animates when pending */}
        <div className="h-1 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800" style={{ opacity: pending ? 1 : 0 }}>
          <div className="h-full w-2/5 rounded-full bg-zinc-900 dark:bg-zinc-100 [animation:bar-slide_1.5s_ease-in-out_infinite]" />
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {/* Customer */}
          <div ref={customerSectionRef} className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              {t.dashboard.customer}
            </label>
            <div className="space-y-2">
              <CustomerPicker
                ref={customerInputRef}
                value={customerId}
                onChange={setCustomerId}
                onCreate={(name) => { void handleCreateCustomer(name); }}
              />
              {customerId && (
                <CustomerDebtPayButton
                  customerId={customerId}
                  onToast={onToast}
                  debtPaymentAmount={debtPaymentAmount}
                  onDebtPaymentAmountChange={onDebtPaymentAmountChange}
                  debtPaymentNote={debtPaymentNote}
                  onDebtPaymentNoteChange={onDebtPaymentNoteChange}
                />
              )}
              {customerId && !customerPhone && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {t.pos.waNoPhone}
                </p>
              )}
              {customerId && customerPhone && onSendWhatsappChange && (
                <button
                  ref={waToggleRef}
                  type="button"
                  onClick={() => onSendWhatsappChange(!sendWhatsapp)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {t.pos.waSendReceipt} · {maskPhone(customerPhone)}
                    <kbd className="inline-flex items-center rounded border border-zinc-300 dark:border-zinc-600 px-1 py-0.5 text-[9px] font-mono text-zinc-400 dark:text-zinc-500">⌥7</kbd>
                  </div>
                  <span
                    role="switch"
                    aria-checked={!!sendWhatsapp}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                      sendWhatsapp
                        ? 'bg-zinc-900 dark:bg-zinc-100'
                        : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        sendWhatsapp ? 'translate-x-4' : 'translate-x-0'
                      } ${sendWhatsapp ? 'dark:bg-zinc-900' : ''}`}
                    />
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Payment method */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t.pos.paymentMethod}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m, idx) => (
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
                  <span className="relative z-10 font-medium uppercase tracking-wider text-xs block">
                    {t.pos[m as keyof typeof t.pos]}
                  </span>
                  <kbd className={`absolute top-1 right-1.5 rounded border px-1 font-mono text-[9px] leading-4 ${
                    m === paymentMethod
                      ? 'border-white/30 text-white/50 dark:border-zinc-900/30 dark:text-zinc-900/50'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500'
                  }`}>
                    ⌥{idx + 2}
                  </kbd>
                </button>
              ))}
            </div>

            {paymentMethod === 'debt' && !customerId && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 animate-in fade-in duration-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="flex-1">{t.pos.selectCustomerForDebt}</p>
                <button
                  type="button"
                  className="shrink-0 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-800 transition-colors"
                  onClick={() => customerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                >
                  ↑ {t.dashboard.customer}
                </button>
              </div>
            )}
          </div>

          {/* Amount received — cash only */}
          {showAmountSection && (
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

              {/* Exact amount — most common action, shown first */}
              <button
                type="button"
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                onClick={() => onAmountReceivedChange(total)}
              >
                {t.pos.exactAmount} — {formatIdr(total)}
              </button>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">
                  Rp
                </span>
                <Input
                  ref={amountInputRef}
                  className="pl-9 h-12 text-lg font-medium tracking-tight"
                  inputMode="numeric"
                  value={amountReceived ? formatIdr(amountReceived).replace('Rp', '').trim() : ''}
                  onChange={(e) => onAmountReceivedChange(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                />
              </div>
              {!amountReceived && (
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                  {t.pos.emptyAmountHint}
                </p>
              )}

            </div>
          )}

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Summary */}
          <div className={`grid gap-4 ${showChangeCard ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-4">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {t.pos.total}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatIdr(total)}
              </div>
            </div>

            {showChangeCard && (
              <div className={`rounded-xl p-4 ${
                paymentStatus === 'debt'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                  : outstandingOrChange > 0 && amountReceived > 0
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50'
              }`}>
                <div className={`text-xs font-medium uppercase tracking-wider ${
                  paymentStatus === 'debt'
                    ? 'text-red-600 dark:text-red-400'
                    : outstandingOrChange > 0 && amountReceived > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  {paymentStatus === 'debt' ? t.pos.debt : t.pos.change}
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight">
                  {paymentMethod === 'cash' && amountReceived === 0
                    ? '—'
                    : formatIdr(outstandingOrChange)
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Button
            className="relative w-full h-12 text-base font-semibold shadow-sm flex items-center justify-center gap-2"
            onClick={onConfirm}
            disabled={pending || (paymentMethod === 'debt' && !customerId)}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{confirmLabel}</span>
            {!pending && (
              <kbd className="absolute right-4 rounded border border-current/20 bg-current/10 px-1.5 py-0.5 font-mono text-[10px] font-normal opacity-70">
                ↵
              </kbd>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
