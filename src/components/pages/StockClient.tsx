'use client';

import { useEffect, useState, useMemo } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { SupplierPicker } from '@/components/shared/SupplierPicker';
import { AutocompleteInput } from './products/AutocompleteInput';
import { formatIdr } from '@/utils/money';
import { StockLogDetailModal } from './stock/StockLogDetailModal';
import { useTranslation } from '@/i18n/useTranslation';
import { Toast } from '@/components/pages/pos/Toast';

type Tab = 'in' | 'out' | 'opname' | 'logs';

type StockLog = {
  id: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  type: string;
  qty: number;
  prevStock: number;
  nextStock: number;
  note: string | null;
  supplierId: string | null;
  unitBuyPrice: number | null;
  createdAt: string;
};

export function StockClient() {
  const [tab, setTab] = useState<Tab>('in');
  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [unitBuyPrice, setUnitBuyPrice] = useState(0);
  const [supplierName, setSupplierName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Pagination and filtering for logs
  const LIMIT = 50;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [filterProductId, setFilterProductId] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const { t } = useTranslation();

  async function loadLogs(p: number, append = false) {
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
  }

  useEffect(() => {
    if (tab === 'logs') {
      setPage(0);
      void loadLogs(0, false);
    }
  }, [tab]);

  const loadMoreLogs = () => {
    if (loadingLogs || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadLogs(nextPage, true);
  };

  async function submit(path: string, payload: unknown) {
    setPending(true);
    setToastMessage(null);
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
    setBrandName('');
    setExpiryDate('');
    setNote('');

    if (tab === 'logs') {
      setPage(0);
      void loadLogs(0, false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <div className="text-xl font-bold tracking-tight">{t.stock.title}</div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {t.stock.subtitle}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['in', 'out', 'opname', 'logs'] as Tab[]).map((tTab) => (
          <button
            key={tTab}
            type="button"
            className={
              tTab === tab
                ? 'rounded-full bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm capitalize'
                : 'rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors capitalize'
            }
            onClick={() => setTab(tTab)}
          >
            {t.stock[tTab as keyof typeof t.stock]}
          </button>
        ))}
      </div>

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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.stock.targetProduct}
                </label>
                <div className="mt-1.5">
                  <ProductPicker value={productId} onChange={setProductId} />
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
                    setQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                  }
                />
              </div>

              {tab === 'in' ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.products.buyPrice}
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                      Rp
                    </span>
                    <Input
                      className="pl-9 font-medium tabular-nums"
                      inputMode="numeric"
                      value={unitBuyPrice ? String(unitBuyPrice) : ''}
                      onChange={(e) =>
                        setUnitBuyPrice(
                          Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                        )
                      }
                    />
                  </div>
                </div>
              ) : null}

              {tab === 'in' ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.dashboard.supplier}
                  </label>
                  <div className="mt-1.5">
                    <SupplierPicker
                      value={supplierName}
                      onChange={setSupplierName}
                    />
                  </div>
                </div>
              ) : null}

              {tab === 'in' ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.stock.expiryDate}
                  </label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              ) : null}

              <div className="md:col-span-2">
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
            </div>

            <Button
              className="mt-8 h-12 w-full text-base font-semibold shadow-sm"
              disabled={
                pending || !productId || qty < (tab === 'opname' ? 0 : 1)
              }
              onClick={() => {
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
                  });
                }
                if (tab === 'opname') {
                  void submit('/api/stock/opname', {
                    productId,
                    qty,
                    note: note.trim() || undefined,
                  });
                }
              }}
            >
              {pending ? t.stock.submitting : t.stock.submit}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-6">
            <div className="space-y-1.5">
              <div className="text-lg font-bold tracking-tight">
                {t.stock.logsTitle}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {t.stock.logsSubtitle}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.reports.from}
                </label>
                <Input
                  className="h-9 w-40 text-sm"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.reports.to}
                </label>
                <Input
                  className="h-9 w-40 text-sm"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="w-[200px]">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.stock.filterProduct}
                </label>
                <ProductPicker
                  value={filterProductId}
                  onChange={setFilterProductId}
                  className="h-9"
                />
              </div>
              <Button
                variant="secondary"
                className="h-9 px-4 font-medium shadow-sm"
                onClick={() => {
                  setPage(0);
                  void loadLogs(0, false);
                }}
                disabled={loadingLogs}
              >
                {loadingLogs ? t.stock.filtering : t.stock.applyFilter}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 px-4 font-medium">
                      {t.dashboard.product}
                    </th>
                    <th className="py-3 px-4 font-medium">{t.stock.type}</th>
                    <th className="py-3 px-4 font-medium text-right">
                      {t.stock.change}
                    </th>
                    <th className="py-3 px-4 font-medium text-right">
                      {t.stock.balance}
                    </th>
                    <th className="py-3 px-4 font-medium">{t.stock.notes}</th>
                    <th className="py-3 px-4 font-medium">{t.reports.date}</th>
                    <th className="py-3 px-4 font-medium text-right">
                      {t.common.action}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {logs.map((l) => (
                    <tr
                      key={l.id}
                      className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="py-3 px-4 align-middle">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {l.productName ?? '-'}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          {l.productSku ?? '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                            l.type === 'in'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : l.type === 'out'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {t.stock[l.type as keyof typeof t.stock]}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <div
                          className={`tabular-nums font-bold ${
                            l.type === 'in'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : l.type === 'out'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {l.type === 'in' ? '+' : l.type === 'out' ? '-' : ''}
                          {l.qty}
                        </div>
                        {l.unitBuyPrice && l.type === 'in' ? (
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                            @ {formatIdr(l.unitBuyPrice)}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                          <span>{l.prevStock}</span>
                          <span className="text-zinc-300 dark:text-zinc-700">
                            →
                          </span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {l.nextStock}
                          </span>
                        </div>
                      </td>
                      <td
                        className="py-3 px-4 align-middle max-w-[200px] truncate text-zinc-600 dark:text-zinc-400"
                        title={l.note ?? ''}
                      >
                        {l.note ?? '-'}
                      </td>
                      <td className="py-3 px-4 align-middle whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        <div>{new Date(l.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs">
                          {new Date(l.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all focus-visible:opacity-100"
                          onClick={() => setSelectedLogId(l.id)}
                          title={t.stock.viewDetail}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">{t.stock.viewDetail}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {loadingLogs && logs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
                          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            {t.stock.loadingLogs}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {logs.length === 0 && !loadingLogs && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                      >
                        {t.stock.noLogs}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="p-4 flex justify-center border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  variant="secondary"
                  onClick={loadMoreLogs}
                  className="w-full max-w-xs"
                >
                  {t.stock.loadMore}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedLogId && (
        <StockLogDetailModal
          log={logs.find((l) => l.id === selectedLogId)!}
          onClose={() => setSelectedLogId(null)}
        />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
