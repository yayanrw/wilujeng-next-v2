'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Printer } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';

import { SalesDetailModal } from './reports/SalesDetailModal';
import { ReceivableDetailModal } from './reports/ReceivableDetailModal';
import { useTranslation } from '@/i18n/useTranslation';

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
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const [selectedReceivableId, setSelectedReceivableId] = useState<
    string | null
  >(null);
  const { t } = useTranslation();

  async function run() {
    setPending(true);
    setError(null);
    let url = '';
    if (tab === 'sales') {
      let params = `date=${encodeURIComponent(date)}`;
      if (paymentMethod !== 'all') {
        params += `&method=${encodeURIComponent(paymentMethod)}`;
      }
      url = `/api/reports/sales?${params}`;
    }
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
      setError(body?.error?.message ?? t.reports.failedToLoad);
      return;
    }
    setData(body);
  }

  useEffect(() => {
    void run();
  }, [tab]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <div className="text-xl font-bold tracking-tight">
          {t.reports.title}
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {t.reports.subtitle}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['sales', 'stock', 'receivables', 'pnl', 'suppliers'] as Tab[]).map(
          (tTab) => (
            <button
              key={tTab}
              type="button"
              className={
                tTab === tab
                  ? 'rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900 capitalize'
                  : 'rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 capitalize'
              }
              onClick={() => setTab(tTab)}
            >
              {t.reports[tTab as keyof typeof t.reports]}
            </button>
          ),
        )}
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {tab === 'sales' && t.reports.dailySalesReport}
                {tab === 'stock' && t.reports.lowStockAlerts}
                {tab === 'receivables' && t.reports.accountsReceivable}
                {tab === 'pnl' && t.reports.profitAndLoss}
                {tab === 'suppliers' && t.reports.supplierSummary}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {t.reports.adjustFilters}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              {tab === 'sales' ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.reports.date}
                    </label>
                    <Input
                      className="h-9 w-40 text-sm"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.reports.method}
                    </label>
                    <select
                      className="h-9 w-32 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="all">{t.common.all || 'All'}</option>
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                      <option value="qris">QRIS</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                </>
              ) : null}

              {tab === 'pnl' || tab === 'suppliers' ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.reports.from}
                    </label>
                    <Input
                      className="h-9 w-40 text-sm"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.reports.to}
                    </label>
                    <Input
                      className="h-9 w-40 text-sm"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </>
              ) : null}

              <Button
                variant="secondary"
                className="h-9 font-medium shadow-sm"
                onClick={() => void run()}
                disabled={pending}
              >
                {pending ? t.reports.running : t.reports.runReport}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="m-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {pending ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t.reports.loadingData}
                </div>
              </div>
            </div>
          ) : tab === 'sales' && Array.isArray(data) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                    <th className="px-4 py-3 font-medium">{t.reports.date}</th>
                    <th className="px-4 py-3 font-medium">{t.reports.id}</th>
                    <th className="px-4 py-3 font-medium">
                      {t.dashboard.customer}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t.reports.total}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t.reports.method}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t.reports.status}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t.common.action}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(data as SalesRow[]).map((tItem) => (
                    <tr
                      key={tItem.id}
                      className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(tItem.createdAt).toLocaleDateString()}{' '}
                        {new Date(tItem.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {String(tItem.id).slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {tItem.customerName ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatIdr(tItem.totalAmount)}
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">
                        {tItem.paymentMethod}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            tItem.status === 'paid' || tItem.status === 'lunas'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {tItem.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                            onClick={() =>
                              window.open(`/receipt/${tItem.id}`, '_blank')
                            }
                            title={t.pos.printReceipt}
                          >
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">
                              {t.pos.printReceipt}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                            onClick={() => setSelectedSalesId(tItem.id)}
                            title={t.stock.viewDetail}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">
                              {t.stock.viewDetail}
                            </span>
                          </Button>
                        </div>
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
                  <tr className="border-b border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                    <th className="px-4 py-3 font-medium">{t.products.sku}</th>
                    <th className="px-4 py-3 font-medium">{t.products.name}</th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t.products.stock}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t.reports.threshold}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(data as StockRow[]).map((p) => (
                    <tr
                      key={p.id}
                      className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600 dark:text-red-400">
                        {p.stock}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
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
                  <tr className="border-b border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                    <th className="px-4 py-3 font-medium">
                      {t.dashboard.customer}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t.customers.phone}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t.reports.debt}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t.common.action}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(data as ReceivableRow[]).map((c) => (
                    <tr
                      key={c.id}
                      className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {c.phone ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600 dark:text-red-400">
                        {formatIdr(c.totalDebt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                          onClick={() => setSelectedReceivableId(c.id)}
                          title={t.stock.viewDetail}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">{t.stock.viewDetail}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'pnl' && data ? (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t.reports.totalSales}
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
                  {formatIdr((data as PnlRow).sales ?? 0)}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t.reports.cogs}
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
                  {formatIdr((data as PnlRow).cogs ?? 0)}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t.reports.netProfit}
                </div>
                <div
                  className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${
                    ((data as PnlRow).profit ?? 0) >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatIdr((data as PnlRow).profit ?? 0)}
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'suppliers' && Array.isArray(data) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                    <th className="px-4 py-3 font-medium">
                      {t.dashboard.supplier}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t.reports.totalQtyIn}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t.reports.purchaseValue}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(data as SupplierRow[]).map((s, idx) => (
                    <tr
                      key={s.supplierId ?? s.supplierName ?? String(idx)}
                      className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {s.supplierName ?? '(Unknown)'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                        {s.totalQty}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
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
