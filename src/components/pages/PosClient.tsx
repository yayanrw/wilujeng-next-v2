'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Printer } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { usePosStore } from '@/stores/posStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { computePayment, type PaymentMethod } from '@/utils/checkout';
import { useTranslation } from '@/i18n/useTranslation';
import { useToast } from '@/hooks/useToast';

import { CartPanel } from './pos/CartPanel';
import { CheckoutModal } from './pos/CheckoutModal';
import { SearchPanel } from './pos/SearchPanel';

export function PosClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState<number>(0);
  const [debtPaymentNote, setDebtPaymentNote] = useState<string>('');
  const { t } = useTranslation();
  const { showToast, Toast } = useToast();

  const items = usePosStore((s) => s.items);
  const customerId = usePosStore((s) => s.customerId);
  const clear = usePosStore((s) => s.clear);

  const setProducts = useCatalogStore((s) => s.setProducts);
  const updateStocks = useCatalogStore((s) => s.updateStocks);
  const setLoading = useCatalogStore((s) => s.setLoading);

  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.subtotal, 0),
    [items],
  );
  const payment = useMemo(
    () => computePayment({ totalAmount: total, paymentMethod, amountReceived }),
    [total, paymentMethod, amountReceived],
  );

  // Initial catalog fetch
  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        const res = await fetch('/api/pos/products');
        if (!res.ok) throw new Error('Failed to fetch catalog');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Catalog fetch error:', err);
        showToast('Failed to load product catalog');
      } finally {
        setLoading(false);
      }
    }
    void fetchCatalog();
  }, [setProducts, setLoading]);

  // Stock polling every 30 seconds
  useEffect(() => {
    async function fetchStocks() {
      try {
        const res = await fetch('/api/pos/products/stocks');
        if (!res.ok) throw new Error('Failed to fetch stocks');
        const data = await res.json();
        updateStocks(data);
      } catch (err) {
        console.error('Stock polling error:', err);
      }
    }

    void fetchStocks(); // Initial stock fetch
    const interval = setInterval(() => {
      void fetchStocks();
    }, 30000);

    return () => clearInterval(interval);
  }, [updateStocks]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function doCheckout() {
    if (!items.length) return;
    if (payment.status === 'debt' && !customerId) {
      showToast(t.pos.selectCustomerForDebt);
      return;
    }

    setCheckoutPending(true);
    const res = await fetch('/api/pos/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentMethod,
        amountReceived,
        customerId: customerId ?? undefined,
        debtPaymentAmount:
          debtPaymentAmount > 0 ? debtPaymentAmount : undefined,
        debtPaymentNote: debtPaymentNote.trim() || undefined,
      }),
    });
    const body = (await res.json().catch(() => null)) as
      | { transactionId: string }
      | { error: { message: string } }
      | null;
    setCheckoutPending(false);
    if (!res.ok) {
      showToast(
        body && 'error' in body ? body.error.message : t.pos.checkoutFailed,
      );
      return;
    }

    if (!body || !('transactionId' in body)) {
      showToast(t.pos.checkoutFailed);
      return;
    }

    setLastTxId(body.transactionId);
    setCheckoutOpen(false);
    showToast(t.pos.transactionSaved);
    clear();
    setAmountReceived(0);
    setDebtPaymentAmount(0);
    setDebtPaymentNote('');
    setPaymentMethod('cash');
    setRefreshKey((k) => k + 1);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="text-lg font-semibold">{t.nav.pos}</div>
        {lastTxId ? (
          <Button
            variant="secondary"
            onClick={() => {
              window.open(
                `/receipt/${lastTxId}`,
                '_blank',
                'noopener,noreferrer',
              );
            }}
          >
            <Printer className="h-4 w-4" />
            {t.pos.printLastReceipt}
          </Button>
        ) : null}
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <SearchPanel
          inputRef={inputRef}
          onToast={showToast}
          refreshKey={refreshKey}
        />
        <CartPanel total={total} onCheckout={() => setCheckoutOpen(true)} />
      </div>

      <Toast />

      <CheckoutModal
        open={checkoutOpen}
        total={total}
        paymentMethod={paymentMethod}
        amountReceived={amountReceived}
        paymentStatus={payment.status}
        outstandingOrChange={
          payment.status === 'debt' ? payment.outstandingDebt : payment.change
        }
        pending={checkoutPending}
        onClose={() => {
          setCheckoutOpen(false);
          setDebtPaymentAmount(0);
          setDebtPaymentNote('');
        }}
        onPaymentMethodChange={setPaymentMethod}
        onAmountReceivedChange={setAmountReceived}
        onConfirm={doCheckout}
        onToast={showToast}
        debtPaymentAmount={debtPaymentAmount}
        onDebtPaymentAmountChange={setDebtPaymentAmount}
        debtPaymentNote={debtPaymentNote}
        onDebtPaymentNoteChange={setDebtPaymentNote}
      />
    </div>
  );
}
