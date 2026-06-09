'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Printer, ShoppingCart, PauseCircle, Info } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { usePosStore } from '@/stores/posStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCustomerStore, type CustomerRow } from '@/stores/customerStore';
import { computePayment, type PaymentMethod } from '@/utils/checkout';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';
import { useToast } from '@/hooks/useToast';

import { BarcodeScannerModal } from './pos/BarcodeScannerModal';
import { CartBottomSheet } from './pos/CartBottomSheet';
import { CartPanel } from './pos/CartPanel';
import { CheckoutModal } from './pos/CheckoutModal';
import { HeldCartsModal } from './pos/HeldCartsModal';
import { ProductCatalog } from './pos/ProductCatalog';

export function PosClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [heldCartsOpen, setHeldCartsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState<number>(0);
  const [debtPaymentNote, setDebtPaymentNote] = useState<string>('');
  const cartBarRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { showToast, Toast } = useToast();

  const items = usePosStore((s) => s.items);
  const customerId = usePosStore((s) => s.customerId);
  const holds = usePosStore((s) => s.holds);
  const clear = usePosStore((s) => s.clear);
  const holdCurrentCart = usePosStore((s) => s.holdCurrentCart);
  const addProduct = usePosStore((s) => s.addProduct);

  const products = useCatalogStore((s) => s.products);
  const stocks = useCatalogStore((s) => s.stocks);

  const setProducts = useCatalogStore((s) => s.setProducts);
  const updateStocks = useCatalogStore((s) => s.updateStocks);
  const setLoading = useCatalogStore((s) => s.setLoading);

  const customers = useCustomerStore((s) => s.customers);
  const setCustomers = useCustomerStore((s) => s.setCustomers);
  const customersLoaded = useCustomerStore((s) => s.loaded);

  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.subtotal, 0),
    [items],
  );
  const totalQty = useMemo(
    () => items.reduce((acc, i) => acc + i.qty, 0),
    [items],
  );
  const payment = useMemo(
    () => computePayment({ totalAmount: total, paymentMethod, amountReceived }),
    [total, paymentMethod, amountReceived],
  );

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch('/api/customers?limit=1000&sortBy=name&sortOrder=asc');
        if (!res.ok) return;
        const data = await res.json() as CustomerRow[];
        setCustomers(data);
      } catch {}
    }
    if (!customersLoaded) void fetchCustomers();
  }, [setCustomers, customersLoaded]);

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

  // Keyboard shortcuts — ref keeps handler always current without re-registering
  const kbHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  kbHandlerRef.current = (e: KeyboardEvent) => {
    const anyModalOpen = checkoutOpen || scannerOpen || cartOpen || heldCartsOpen || shortcutsOpen;

    if (e.key === 'Escape') {
      if (shortcutsOpen) { setShortcutsOpen(false); return; }
      if (checkoutOpen) { setCheckoutOpen(false); return; }
      if (heldCartsOpen) { setHeldCartsOpen(false); return; }
      if (cartOpen) { setCartOpen(false); return; }
      if (scannerOpen) { setScannerOpen(false); return; }
      return;
    }

    if (checkoutOpen) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!checkoutPending && items.length > 0) void doCheckout();
        return;
      }
      const methods = ['cash', 'qris', 'transfer', 'debt'] as const;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1) { e.preventDefault(); setPaymentMethod(methods[idx]); }
      return;
    }

    if (anyModalOpen) return;

    if (e.key === 'F2') { e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select(); return; }
    if (e.key === 'F3') { e.preventDefault(); if (items.length > 0) setCheckoutOpen(true); return; }
    if (e.key === 'F4') { e.preventDefault(); if (items.length > 0) handleHold(); return; }
    if (e.key === 'F5') { e.preventDefault(); setHeldCartsOpen(true); return; }
    if (e.key === 'F6') {
      e.preventDefault();
      if (lastTxId) window.open(`/receipt/${lastTxId}`, '_blank', 'noopener,noreferrer');
      return;
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => kbHandlerRef.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      const el = cartBarRef.current;
      if (!el) return;
      const hidden = window.innerHeight - (vv!.height + vv!.offsetTop);
      el.style.bottom = `${Math.max(0, hidden) + 16}px`;
    }

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Load view mode preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pos-view-mode');
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);

  function handleViewModeChange(mode: 'grid' | 'list') {
    setViewMode(mode);
    localStorage.setItem('pos-view-mode', mode);
  }

  function handleBarcodeScan(sku: string) {
    const product = products.find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase(),
    );
    if (!product) {
      showToast(t.pos.productNotFound);
      return;
    }
    const stock = stocks[product.id] ?? 0;
    if (stock === 0) {
      showToast(t.pos.scannerOutOfStock ?? t.pos.outOfStock);
      return;
    }
    addProduct({ ...product, stock }, 1);
    showToast(`${product.name} +1`);
  }

  function handleHold() {
    const customerName = customerId
      ? customers.find((c) => c.id === customerId)?.name
      : undefined;
    const ok = holdCurrentCart(customerName);
    if (!ok) showToast(t.pos.maxHoldsReached);
    else inputRef.current?.focus();
  }

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
    setScannerOpen(false);
    showToast(t.pos.transactionSaved);
    clear();
    setAmountReceived(0);
    setDebtPaymentAmount(0);
    setDebtPaymentNote('');
    setPaymentMethod('cash');
    setRefreshKey((k) => k + 1);
    inputRef.current?.focus();

    // Refresh customer list so debt balances reflect the completed transaction
    fetch('/api/customers?limit=1000&sortBy=name&sortOrder=asc')
      .then((r) => r.json())
      .then((data: CustomerRow[]) => setCustomers(data))
      .catch(() => {});
  }

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-0 lg:h-[calc(100vh-6rem)] w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="text-lg font-semibold">{t.nav.pos}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            title={t.pos.shortcutsTitle}
          >
            <Info className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setHeldCartsOpen(true)}
            className="relative flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 h-9 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <PauseCircle className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">{t.pos.heldTransactions}</span>
            {holds.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1 leading-none">
                {holds.length}
              </span>
            )}
          </button>
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
      </div>

      <div className="grid lg:flex-1 lg:min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] min-w-0">
        <ProductCatalog
          inputRef={inputRef}
          onToast={showToast}
          onCameraClick={() => setScannerOpen(true)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <div className="hidden lg:flex lg:flex-col lg:min-h-0">
          <CartPanel total={total} onCheckout={() => setCheckoutOpen(true)} onHold={handleHold} />
        </div>
      </div>

      {/* Mobile sticky cart bar — fixed to bottom of viewport */}
      <div
        ref={cartBarRef}
        className="lg:hidden fixed inset-x-0 z-20 px-4 pb-4 pt-2 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent"
        style={{ bottom: 16 }}
      >
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="w-full flex items-center justify-between bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-3 rounded-xl shadow-lg transition-opacity active:opacity-80"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-sm font-medium">
              {totalQty} {totalQty === 1 ? t.pos.item : t.pos.items}
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {formatIdr(total)}
          </span>
        </button>
      </div>

      <Toast />

      <HeldCartsModal
        open={heldCartsOpen}
        onClose={() => setHeldCartsOpen(false)}
      />

      <BarcodeScannerModal
        open={scannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setScannerOpen(false)}
        isMobile={isMobile}
        totalQty={totalQty}
        total={total}
        onOpenCart={() => setCartOpen(true)}
      />

      <CartBottomSheet
        open={cartOpen}
        total={total}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        onHold={() => {
          handleHold();
          setCartOpen(false);
        }}
      />

      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-[150] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-5 py-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t.pos.shortcutsTitle}</h2>
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-600 dark:text-zinc-400 transition-colors"
                onClick={() => setShortcutsOpen(false)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t.pos.shortcutGlobal}</div>
                {([
                  ['F2', t.pos.shortcutFocusSearch],
                  ['F3', t.pos.shortcutOpenCheckout],
                  ['F4', t.pos.shortcutHold],
                  ['F5', t.pos.shortcutOpenHeld],
                  ['F6', t.pos.shortcutPrintReceipt],
                  ['Esc', t.pos.shortcutClose],
                ] as [string, string][]).map(([kbd, label]) => (
                  <div key={kbd} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
                    <kbd className="ml-4 shrink-0 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">{kbd}</kbd>
                  </div>
                ))}
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t.pos.shortcutInCheckout}</div>
                {([
                  ['1', `${t.pos.shortcutSelectPayment} — ${t.pos.cash}`],
                  ['2', `${t.pos.shortcutSelectPayment} — ${t.pos.qris}`],
                  ['3', `${t.pos.shortcutSelectPayment} — ${t.pos.transfer}`],
                  ['4', `${t.pos.shortcutSelectPayment} — ${t.pos.debt}`],
                  ['Enter', t.pos.shortcutConfirmPayment],
                ] as [string, string][]).map(([kbd, label]) => (
                  <div key={kbd} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
                    <kbd className="ml-4 shrink-0 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">{kbd}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
