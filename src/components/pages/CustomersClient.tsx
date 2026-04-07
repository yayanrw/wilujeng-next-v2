'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';
import { Toast } from './pos/Toast';
import { CustomerForm, type CustomerDto } from './customers/CustomerForm';
import { PayDebtModal } from './customers/PayDebtModal';
import { useTranslation } from '@/i18n/useTranslation';

type CustomerDetail = {
  customer: CustomerDto;
  transactions: Array<{
    id: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }>;
};

export function CustomersClient() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [payDebtCustomer, setPayDebtCustomer] = useState<{
    id: string;
    name: string;
    totalDebt: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'totalDebt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { t } = useTranslation();
  const LIMIT = 50;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selected = useMemo(
    () => customers.find((c) => c.id === selectedId) ?? null,
    [customers, selectedId],
  );

  async function fetchCustomers(
    q: string,
    p: number,
    append = false,
    currentSortBy = sortBy,
    currentSortOrder = sortOrder,
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      params.append('limit', LIMIT.toString());
      params.append('offset', (p * LIMIT).toString());
      params.append('sortBy', currentSortBy);
      params.append('sortOrder', currentSortOrder);

      const res = await fetch(`/api/customers?${params.toString()}`);
      const body = (await res.json().catch(() => [])) as CustomerDto[];

      setHasMore(body.length === LIMIT);

      if (append) {
        setCustomers((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...body.filter((item) => !existingIds.has(item.id))];
        });
      } else {
        setCustomers(body);
      }
    } catch (err) {
      console.error(err);
      if (!append) setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setPage(0);
    await fetchCustomers(search, 0, false, sortBy, sortOrder);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    setPage(0);
    const t = window.setTimeout(
      () => void fetchCustomers(search, 0, false, sortBy, sortOrder),
      500,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Handle sort changes
  const handleSort = (column: 'name' | 'points' | 'totalDebt') => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
    setPage(0);
    void fetchCustomers(search, 0, false, column, newOrder);
  };

  // Fetch customer detail for transactions when selected
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void fetch(`/api/customers/${selectedId}`)
      .then((r) => r.json())
      .then((d: CustomerDetail & { error?: unknown }) => {
        if (!cancelled && !d.error) setDetail(d as CustomerDetail);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    void fetchCustomers(search, nextPage, true, sortBy, sortOrder);
  };

  const SortIcon = ({
    column,
  }: {
    column: 'name' | 'points' | 'totalDebt';
  }) => {
    if (sortBy !== column)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-20" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <div className="text-xl font-bold tracking-tight">
          {t.customers.title}
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {t.customers.subtitle}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="h-fit">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6">
            <div className="w-full sm:w-72 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <Input
                placeholder={t.customers.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading && customers.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {t.customers.loading}
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                      <th
                        className="py-3 px-4 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          {t.customers.customerDetails}
                          <SortIcon column="name" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 font-medium text-right cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        onClick={() => handleSort('points')}
                      >
                        <div className="flex items-center justify-end">
                          {t.customers.points}
                          <SortIcon column="points" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 font-medium text-right cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        onClick={() => handleSort('totalDebt')}
                      >
                        <div className="flex items-center justify-end">
                          {t.pos.outstandingDebt}
                          <SortIcon column="totalDebt" />
                        </div>
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        {t.common.action}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        className={`group transition-colors ${
                          c.id === selectedId
                            ? 'bg-zinc-50 dark:bg-zinc-900'
                            : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
                        }`}
                      >
                        <td className="py-3 px-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="truncate font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left"
                                onClick={() => {
                                  setSelectedId(c.id);
                                  setMode('edit');
                                }}
                              >
                                {c.name}
                              </button>
                              {c.totalDebt > 0 ? (
                                <Badge
                                  tone="danger"
                                  className="h-5 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider"
                                >
                                  {t.customers.hasDebt}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 font-mono">
                              {c.phone ?? t.customers.noPhone}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                          {c.points}
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <div
                            className={`tabular-nums font-semibold ${c.totalDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}
                          >
                            {formatIdr(c.totalDebt)}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.totalDebt > 0 && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50 dark:hover:bg-red-900/40"
                                onClick={() => {
                                  setPayDebtCustomer({
                                    id: c.id,
                                    name: c.name,
                                    totalDebt: c.totalDebt,
                                  });
                                }}
                              >
                                {t.customers.payDebt}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all focus-visible:opacity-100"
                              onClick={() => {
                                setSelectedId(c.id);
                                setMode('edit');
                              }}
                              title={t.customers.editCustomer}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">{t.common.edit}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && customers.length === 0 ? (
              <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                {t.customers.noCustomers}
              </div>
            ) : null}

            {hasMore && customers.length > 0 && !loading && (
              <div className="p-4 flex justify-center border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full max-w-xs"
                >
                  {t.customers.loadMore}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
            <div className="space-y-1">
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {mode === 'create'
                  ? t.customers.addCustomer
                  : t.customers.editCustomer}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {mode === 'create'
                  ? t.customers.createProfile
                  : t.customers.updateProfile}
              </div>
            </div>
            {mode === 'edit' && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8"
                onClick={() => {
                  setMode('create');
                  setSelectedId(null);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.common.new}
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6">
              <CustomerForm
                mode={mode}
                initial={mode === 'edit' ? (selected ?? undefined) : undefined}
                onSaved={async (success, errorMsg) => {
                  if (success) {
                    await refresh();
                    if (mode === 'create') {
                      setMode('create');
                    }
                    showToast(
                      mode === 'create'
                        ? t.customers.createdSuccess
                        : t.customers.updatedSuccess,
                    );
                  } else {
                    showToast(errorMsg || t.customers.saveFailed);
                  }
                }}
              />

              {mode === 'edit' && detail && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">
                      {t.customers.recentTransactions}
                    </div>
                  </div>
                  {detail.transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                            <th className="py-2">{t.reports.id}</th>
                            <th className="py-2">{t.reports.total}</th>
                            <th className="py-2">{t.reports.status}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.transactions.map((tItem) => (
                            <tr
                              key={tItem.id}
                              className="border-b border-zinc-100 dark:border-zinc-800"
                            >
                              <td className="py-2 font-mono text-xs">
                                {tItem.id.slice(0, 8)}
                              </td>
                              <td className="py-2 tabular-nums">
                                {formatIdr(tItem.totalAmount)}
                              </td>
                              <td className="py-2">
                                <Badge
                                  tone={
                                    tItem.status === 'debt'
                                      ? 'danger'
                                      : 'success'
                                  }
                                  className="text-[10px] px-1.5 py-0 h-4"
                                >
                                  {t.pos[tItem.status as keyof typeof t.pos] ||
                                    tItem.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-100 rounded-lg p-4 text-center border border-zinc-100 dark:border-zinc-800">
                      {t.customers.noRecentTransactions}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Toast message={toastMessage} />

      {payDebtCustomer && (
        <PayDebtModal
          customerName={payDebtCustomer.name}
          totalDebt={payDebtCustomer.totalDebt}
          onClose={() => setPayDebtCustomer(null)}
          onSubmit={async (amount, method) => {
            const res = await fetch(
              `/api/customers/${payDebtCustomer.id}/pay-debt`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, paymentMethod: method }),
              },
            );

            if (res.ok) {
              showToast(t.customers.paymentSuccessful);
              setPayDebtCustomer(null);
              await refresh();
              if (selectedId === payDebtCustomer.id) {
                const dRes = await fetch(`/api/customers/${selectedId}`);
                const dData = await dRes.json();
                setDetail(dData);
              }
            } else {
              const err = await res.json();
              showToast(err.error?.message || t.customers.paymentFailed);
            }
          }}
        />
      )}
    </div>
  );
}
