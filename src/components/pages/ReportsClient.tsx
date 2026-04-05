'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';

import { SalesDetailModal } from './reports/SalesDetailModal';
import { ReceivableDetailModal } from './reports/ReceivableDetailModal';

type Tab = 'sales' | 'stock' | 'receivables' | 'pnl' | 'suppliers';

type SalesRow = {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customerName: string | null;
};

type StockRow = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  minStockThreshold: number;
};

type ReceivableRow = {
  id: string;
  name: string;
  phone: string | null;
  totalDebt: number;
};

type PnlRow = { sales: number; cogs: number; profit: number };

type SupplierRow = {
  supplierId: string | null;
  supplierName: string | null;
  totalQty: number;
  purchaseValue: number;
};

export function ReportsClient() {
  const [tab, setTab] = useState<Tab>('sales');
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(todayStr);
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const [selectedReceivableId, setSelectedReceivableId] = useState<
    string | null
  >(null);

  async function run() {
    setPending(true);
    setError(null);
    let url = '';
    if (tab === 'sales')
      url = `/api/reports/sales?date=${encodeURIComponent(date)}`;
    if (tab === 'stock') url = `/api/reports/stock-low`;
    if (tab === 'receivables') url = `/api/reports/receivables`;
    if (tab === 'pnl')
      url = `/api/reports/pnl?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    if (tab === 'suppliers')
      url = `/api/reports/suppliers?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const res = await fetch(url);
    const body = await res.json().catch(() => null);
    setPending(false);
    if (!res.ok) {
      setError(body?.error?.message ?? 'Failed to load report');
      return;
    }
    setData(body);
  }

  useEffect(() => {
    void run();
  }, [tab]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold">Reports</div>

      <div className="flex flex-wrap gap-2">
        {(['sales', 'stock', 'receivables', 'pnl', 'suppliers'] as Tab[]).map(
          (t) => (
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
          ),
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Filters</div>
              <div className="text-xs text-zinc-500">Adjust and run</div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              {tab === 'sales' ? (
                <div>
                  <label className="text-xs text-zinc-500">Date</label>
                  <Input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              ) : null}

              {tab === 'pnl' || tab === 'suppliers' ? (
                <>
                  <div>
                    <label className="text-xs text-zinc-500">From</label>
                    <Input
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">To</label>
                    <Input
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </>
              ) : null}

              <Button
                variant="secondary"
                onClick={() => void run()}
                disabled={pending}
              >
                {pending ? 'Running...' : 'Run'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {tab === 'sales' && Array.isArray(data) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2">Date</th>
                    <th className="py-2">ID</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data as SalesRow[]).map((t) => (
                    <tr key={t.id} className="border-b border-zinc-100">
                      <td className="py-2 whitespace-nowrap text-zinc-600">
                        {new Date(t.createdAt).toLocaleDateString()}{' '}
                        {new Date(t.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 font-mono text-xs text-zinc-500">
                        {String(t.id).slice(0, 8)}
                      </td>
                      <td className="py-2">{t.customerName ?? '-'}</td>
                      <td className="py-2 tabular-nums">
                        {formatIdr(t.totalAmount)}
                      </td>
                      <td className="py-2 capitalize">{t.paymentMethod}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            t.status === 'lunas'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-zinc-500 hover:text-zinc-900"
                          onClick={() => setSelectedSalesId(t.id)}
                          title="View detail"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Detail</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'stock' && Array.isArray(data) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2">SKU</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Stock</th>
                    <th className="py-2">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {(data as StockRow[]).map((p) => (
                    <tr key={p.id} className="border-b border-zinc-100">
                      <td className="py-2 font-mono text-xs">{p.sku}</td>
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 tabular-nums">{p.stock}</td>
                      <td className="py-2 tabular-nums">
                        {p.minStockThreshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'receivables' && Array.isArray(data) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2">Customer</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Debt</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data as ReceivableRow[]).map((c) => (
                    <tr key={c.id} className="border-b border-zinc-100">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2">{c.phone ?? '-'}</td>
                      <td className="py-2 text-red-600 font-medium tabular-nums">
                        {formatIdr(c.totalDebt)}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-zinc-500 hover:text-zinc-900"
                          onClick={() => setSelectedReceivableId(c.id)}
                          title="View detail"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Detail</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'pnl' && data ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="text-xs text-zinc-500">Sales</div>
                <div className="mt-1 text-base font-semibold tabular-nums">
                  {formatIdr((data as PnlRow).sales ?? 0)}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="text-xs text-zinc-500">COGS</div>
                <div className="mt-1 text-base font-semibold tabular-nums">
                  {formatIdr((data as PnlRow).cogs ?? 0)}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="text-xs text-zinc-500">Profit</div>
                <div className="mt-1 text-base font-semibold tabular-nums">
                  {formatIdr((data as PnlRow).profit ?? 0)}
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'suppliers' && Array.isArray(data) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2">Supplier</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(data as SupplierRow[]).map((s, idx) => (
                    <tr
                      key={s.supplierId ?? s.supplierName ?? String(idx)}
                      className="border-b border-zinc-100"
                    >
                      <td className="py-2">{s.supplierName ?? '(Unknown)'}</td>
                      <td className="py-2 tabular-nums">{s.totalQty}</td>
                      <td className="py-2 tabular-nums">
                        {formatIdr(s.purchaseValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedSalesId && (
        <SalesDetailModal
          transactionId={selectedSalesId}
          onClose={() => setSelectedSalesId(null)}
        />
      )}

      {selectedReceivableId && (
        <ReceivableDetailModal
          customerId={selectedReceivableId}
          onClose={() => setSelectedReceivableId(null)}
        />
      )}
    </div>
  );
}
