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
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Pagination and filtering for logs
  const LIMIT = 50;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  async function loadLogs(p: number, append = false) {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', LIMIT.toString());
      params.append('offset', (p * LIMIT).toString());
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);

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
    setMessage(null);
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
      setMessage(
        body && 'error' in body ? body.error.message : 'Request failed',
      );
      return;
    }
    if (!body || !('prevStock' in body)) {
      setMessage('OK');
      return;
    }
    setMessage(`OK: stock ${body.prevStock} → ${body.nextStock}`);
    setNote('');
    if (tab === 'logs') {
      setPage(0);
      void loadLogs(0, false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold">Stock</div>

      <div className="flex flex-wrap gap-2">
        {(['in', 'out', 'opname', 'logs'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={
              t === tab
                ? 'rounded-full bg-zinc-900 px-4 py-2 text-sm text-white'
                : 'rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50'
            }
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {message ? (
        <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
          {message}
        </div>
      ) : null}

      {tab !== 'logs' ? (
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">
              Stock {tab.toUpperCase()}
            </div>
            <div className="text-xs text-zinc-500">
              Choose product, enter qty, then submit
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Product</label>
                <ProductPicker value={productId} onChange={setProductId} />
              </div>

              <div>
                <label className="text-sm font-medium">Qty</label>
                <Input
                  value={String(qty)}
                  onChange={(e) => setQty(Number(e.target.value) || 0)}
                />
              </div>

              {tab === 'in' ? (
                <div>
                  <label className="text-sm font-medium">Unit buy price</label>
                  <Input
                    value={String(unitBuyPrice)}
                    onChange={(e) =>
                      setUnitBuyPrice(Number(e.target.value) || 0)
                    }
                  />
                </div>
              ) : null}

              {tab === 'in' ? (
                <div>
                  <label className="text-sm font-medium">
                    Supplier (type to create)
                  </label>
                  <SupplierPicker
                    value={supplierName}
                    onChange={setSupplierName}
                  />
                </div>
              ) : null}

              <div className={tab === 'in' ? '' : 'md:col-span-2'}>
                <AutocompleteInput
                  label="Brand (type to create)"
                  value={brandName}
                  onChange={setBrandName}
                  fetchEndpoint="/api/brands"
                  placeholder="Brand name"
                />
              </div>

              {tab === 'in' ? (
                <div>
                  <label className="text-sm font-medium">
                    Expiry date (YYYY-MM-DD)
                  </label>
                  <Input
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="2026-12-31"
                  />
                </div>
              ) : null}

              <div className={tab === 'in' ? 'md:col-span-2' : 'md:col-span-2'}>
                <label className="text-sm font-medium">Note</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <Button
              className="mt-3"
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
                    brandName: brandName.trim() || undefined,
                    expiryDate: expiryDate.trim() || undefined,
                    note: note.trim() || undefined,
                  });
                }
                if (tab === 'out') {
                  void submit('/api/stock/out', {
                    productId,
                    qty,
                    brandName: brandName.trim() || undefined,
                    note: note.trim() || undefined,
                  });
                }
                if (tab === 'opname') {
                  void submit('/api/stock/opname', {
                    productId,
                    qty,
                    brandName: brandName.trim() || undefined,
                    note: note.trim() || undefined,
                  });
                }
              }}
            >
              {pending ? 'Submitting...' : 'Submit'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Stock logs</div>
                <div className="text-xs text-zinc-500">
                  Recent inventory changes
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="text-xs text-zinc-500">From</label>
                  <Input
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">To</label>
                  <Input
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPage(0);
                    void loadLogs(0, false);
                  }}
                  disabled={loadingLogs}
                >
                  {loadingLogs ? 'Loading...' : 'Run'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2">Product</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Prev</th>
                    <th className="py-2">Next</th>
                    <th className="py-2">Unit buy</th>
                    <th className="py-2">Note</th>
                    <th className="py-2">At</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-zinc-100">
                      <td className="py-2">
                        <div className="font-medium">
                          {l.productName ?? '-'}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">
                          {l.productSku ?? '-'}
                        </div>
                      </td>
                      <td className="py-2 uppercase text-xs font-semibold">
                        {l.type}
                      </td>
                      <td className="py-2 tabular-nums">{l.qty}</td>
                      <td className="py-2 tabular-nums text-zinc-500">
                        {l.prevStock}
                      </td>
                      <td className="py-2 tabular-nums font-medium">
                        {l.nextStock}
                      </td>
                      <td className="py-2 tabular-nums">
                        {l.unitBuyPrice ? formatIdr(l.unitBuyPrice) : ''}
                      </td>
                      <td
                        className="py-2 max-w-[200px] truncate"
                        title={l.note ?? ''}
                      >
                        {l.note ?? ''}
                      </td>
                      <td className="py-2 whitespace-nowrap text-zinc-600">
                        {new Date(l.createdAt).toLocaleDateString()}{' '}
                        {new Date(l.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-zinc-500 hover:text-zinc-900"
                          onClick={() => setSelectedLogId(l.id)}
                          title="View detail"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Detail</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && !loadingLogs && (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-4 text-center text-zinc-500"
                      >
                        No logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  onClick={loadMoreLogs}
                  disabled={loadingLogs}
                >
                  {loadingLogs ? 'Loading...' : 'Load More'}
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
    </div>
  );
}
