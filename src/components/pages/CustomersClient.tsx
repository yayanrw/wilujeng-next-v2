'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  HandCoins,
  Trash,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { TableLoading } from '@/components/ui/TableLoading';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatIdr } from '@/utils/money';
import { useToast } from '@/hooks/useToast';
import { CustomerForm, type CustomerDto } from './customers/CustomerForm';
import { PayDebtModal } from './customers/PayDebtModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'totalDebt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { t } = useTranslation();
  const LIMIT = 50;

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

  function openDeleteDialog(id: string) {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${deletingId}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && (body.deleted === true || body.deleted === 'true');
      if (ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== deletingId));
        showToast(t.customers.deletedSuccess || 'Deleted');
      } else {
        showToast(
          t.customers.deleteFailed ||
            t.customers.saveFailed ||
            'Failed to delete',
        );
      }
    } catch (err) {
      console.error(err);
      showToast(
        t.customers.deleteFailed ||
          t.customers.saveFailed ||
          'Failed to delete',
      );
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  }

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
      <PageHeader
        title={t.customers.title}
        subtitle={t.customers.subtitle}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="h-fit">
          <CardHeader className="pb-6">
            <SearchInput
              placeholder={t.customers.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              wrapperClassName="w-full sm:w-72"
            />
          </CardHeader>
          <CardContent className="p-0">
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
                  {loading && customers.length === 0 ? (
                    <TableLoading colSpan={4} message={t.customers.loading} />
                  ) : customers.length === 0 ? (
                    <TableEmpty colSpan={4} message={t.customers.noCustomers} />
                  ) : (
                    customers.map((c) => (
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
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200 transition-colors"
                                onClick={() => {
                                  setPayDebtCustomer({
                                    id: c.id,
                                    name: c.name,
                                    totalDebt: c.totalDebt,
                                  });
                                }}
                                title={t.customers.payDebt}
                              >
                                <HandCoins className="h-4 w-4" />
                                <span className="sr-only">
                                  {t.customers.payDebt}
                                </span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                              onClick={() => {
                                setSelectedId(c.id);
                                setMode('edit');
                              }}
                              title={t.customers.editCustomer}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">{t.common.edit}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              onClick={() => openDeleteDialog(c.id)}
                              title={t.common.delete}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">{t.common.delete}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <LoadMoreButton
              onClick={loadMore}
              hasMore={hasMore && customers.length > 0}
              label={t.customers.loadMore}
            />
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
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900  rounded-lg p-4 text-center border border-zinc-100 dark:border-zinc-800">
                      {t.customers.noRecentTransactions}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={t.customers.deleteConfirmTitle}
        description={t.customers.deleteConfirmDesc}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {payDebtCustomer && (
        <PayDebtModal
          customerName={payDebtCustomer.name}
          totalDebt={payDebtCustomer.totalDebt}
          onClose={() => setPayDebtCustomer(null)}
          onSubmit={async (amount, method, note) => {
            const res = await fetch(
              `/api/customers/${payDebtCustomer.id}/pay-debt`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, paymentMethod: method, note }),
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
