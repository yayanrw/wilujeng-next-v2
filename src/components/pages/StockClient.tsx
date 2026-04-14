'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { TabNav } from '@/components/ui/TabNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { StockLogDetailModal } from './stock/StockLogDetailModal';
import { StockInForm } from './stock/StockInForm';
import { StockOutForm } from './stock/StockOutForm';
import { StockOpnameForm } from './stock/StockOpnameForm';
import { StockLogs, type StockLog } from './stock/StockLogs';
import { useTranslation } from '@/i18n/useTranslation';
import { useToast } from '@/hooks/useToast';

type Tab = 'in' | 'out' | 'opname' | 'logs';

export function StockClient() {
  // Tab state
  const [tab, setTab] = useState<Tab>('in');
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  // Form state - shared across tabs
  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);

  // In form specific state
  const [unitBuyPrice, setUnitBuyPrice] = useState(0);
  const [supplierName, setSupplierName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Out form specific state
  const [outType, setOutType] = useState<'out' | 'return'>('out');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  // Logs state
  const [logs, setLogs] = useState<StockLog[]>([]);
  const LIMIT = 50;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [filterProductId, setFilterProductId] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const loadLogs = useCallback(
    async (p: number, append = false) => {
      setLoadingLogs(true);
      try {
        const params = new URLSearchParams();
        params.append('limit', LIMIT.toString());
        params.append('offset', (p * LIMIT).toString());
        if (dateFrom) params.append('from', dateFrom);
        if (dateTo) params.append('to', dateTo);
        if (filterProductId) params.append('productId', filterProductId);

        const res = await fetch(`/api/stock/logs?${params.toString()}`);
        const body = (await res.json().catch(() => [])) as StockLog[];

        setHasMore(body.length === LIMIT);

        if (append) {
          setLogs((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            return [...prev, ...body.filter((item) => !existingIds.has(item.id))];
          });
        } else {
          setLogs(body);
        }
      } catch (err) {
        console.error(err);
        if (!append) setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    },
    [LIMIT, dateFrom, dateTo, filterProductId],
  );

  useEffect(() => {
    if (tab === 'logs') {
      setPage(0);
      void loadLogs(0, false);
    }
  }, [tab, loadLogs]);

  const loadMoreLogs = () => {
    if (loadingLogs || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadLogs(nextPage, true);
  };

  async function submit(path: string, payload: unknown) {
    setPending(true);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as
        | { prevStock: number; nextStock: number }
        | { error: { message: string } }
        | null;
      setPending(false);
      if (!res.ok) {
        showToast(
          body && 'error' in body ? body.error.message : 'Request failed',
        );
        return;
      }
      if (!body || !('prevStock' in body)) {
        showToast('OK');
        return;
      }
      showToast(`OK: stock ${body.prevStock} → ${body.nextStock}`);
      setProductId(null);
      setQty(1);
      setUnitBuyPrice(0);
      setSupplierName('');
      setExpiryDate('');
      setNote('');
      setTransactionId(null);
      setReturnReason('');

      if (tab === 'logs') {
        setPage(0);
        void loadLogs(0, false);
      }
    } catch {
      setPending(false);
      showToast('Terjadi kesalahan, silakan coba lagi');
    }
  }

  const handleSubmit = () => {
    if (!productId) return;

    if (tab === 'in') {
      void submit('/api/stock/in', {
        productId,
        qty,
        unitBuyPrice,
        supplierName: supplierName.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        note: note.trim() || undefined,
      });
    }

    if (tab === 'out') {
      void submit('/api/stock/out', {
        productId,
        qty,
        note: note.trim() || undefined,
        type: outType,
        transactionId:
          outType === 'return' ? transactionId || undefined : undefined,
        returnReason:
          outType === 'return' ? returnReason.trim() || undefined : undefined,
      });
    }

    if (tab === 'opname') {
      void submit('/api/stock/opname', {
        productId,
        qty,
        note: note.trim() || undefined,
      });
    }
  };

  const handleApplyFilter = () => {
    setPage(0);
    void loadLogs(0, false);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t.stock.title}
        subtitle={t.stock.subtitle}
      />

      <TabNav
        tabs={(['in', 'out', 'opname', 'logs'] as Tab[]).map((tTab) => ({
          value: tTab,
          label: t.stock[tTab as keyof typeof t.stock],
        }))}
        value={tab}
        onChange={(value) => setTab(value as Tab)}
      />

      {tab !== 'logs' ? (
        <Card className="max-w-3xl overflow-visible">
          <CardHeader className="rounded-t-xl border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
              {t.stock[tab as keyof typeof t.stock]}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {tab === 'in' && t.stock.inDesc}
              {tab === 'out' && t.stock.outDesc}
              {tab === 'opname' && t.stock.opnameDesc}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {tab === 'in' && (
              <StockInForm
                productId={productId}
                onProductChange={setProductId}
                qty={qty}
                onQtyChange={setQty}
                unitBuyPrice={unitBuyPrice}
                onUnitBuyPriceChange={setUnitBuyPrice}
                supplierName={supplierName}
                onSupplierNameChange={setSupplierName}
                expiryDate={expiryDate}
                onExpiryDateChange={setExpiryDate}
                note={note}
                onNoteChange={setNote}
                onSubmit={handleSubmit}
                pending={pending}
              />
            )}

            {tab === 'out' && (
              <StockOutForm
                productId={productId}
                onProductChange={setProductId}
                qty={qty}
                onQtyChange={setQty}
                outType={outType}
                onOutTypeChange={setOutType}
                transactionId={transactionId}
                onTransactionIdChange={setTransactionId}
                returnReason={returnReason}
                onReturnReasonChange={setReturnReason}
                note={note}
                onNoteChange={setNote}
                onSubmit={handleSubmit}
                pending={pending}
              />
            )}

            {tab === 'opname' && (
              <StockOpnameForm
                productId={productId}
                onProductChange={setProductId}
                qty={qty}
                onQtyChange={setQty}
                note={note}
                onNoteChange={setNote}
                onSubmit={handleSubmit}
                pending={pending}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <StockLogs
              logs={logs}
              loadingLogs={loadingLogs}
              hasMore={hasMore}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              filterProductId={filterProductId}
              onFilterProductIdChange={setFilterProductId}
              onApplyFilter={handleApplyFilter}
              onLoadMore={loadMoreLogs}
              onViewDetail={setSelectedLogId}
            />
          </CardContent>
        </Card>
      )}

      {selectedLogId && (
        <StockLogDetailModal
          log={logs.find((l) => l.id === selectedLogId)!}
          onClose={() => setSelectedLogId(null)}
        />
      )}
      <Toast />
    </div>
  );
}
