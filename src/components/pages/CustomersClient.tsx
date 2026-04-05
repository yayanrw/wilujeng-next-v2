'use client';

import { useEffect, useMemo, useState } from 'react';

import { Plus, Pencil, ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';
import { Toast } from './pos/Toast';
import { CustomerForm, type CustomerDto } from './customers/CustomerForm';

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

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const LIMIT = 50;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selected = useMemo(
    () => customers.find((c) => c.id === selectedId) ?? null,
    [customers, selectedId],
  );

  async function fetchCustomers(q: string, p: number, append = false) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      params.append('limit', LIMIT.toString());
      params.append('offset', (p * LIMIT).toString());

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
    await fetchCustomers(search, 0, false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    setPage(0);
    const t = window.setTimeout(
      () => void fetchCustomers(search, 0, false),
      500,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
    fetchCustomers(search, nextPage, true);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Customers</div>
          <div className="mt-3">
            <Input
              placeholder="Search name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                  <th className="py-2">Name</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Points</th>
                  <th className="py-2">Debt</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className={
                      c.id === selectedId
                        ? 'border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-100'
                        : 'border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-100'
                    }
                  >
                    <td className="py-2">
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        onClick={() => {
                          setSelectedId(c.id);
                          setMode('edit');
                        }}
                      >
                        {c.name}
                      </button>
                      {c.totalDebt > 0 ? (
                        <div className="mt-1">
                          <Badge tone="warning">Has debt</Badge>
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2">{c.phone ?? '-'}</td>
                    <td className="py-2 tabular-nums">{c.points}</td>
                    <td className="py-2 tabular-nums">
                      {formatIdr(c.totalDebt)}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-50"
                        onClick={() => {
                          setSelectedId(c.id);
                          setMode('edit');
                        }}
                        title="Edit customer"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && customers.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
          ) : null}
          {!loading && customers.length === 0 && search ? (
            <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
              No customers found.
            </div>
          ) : null}

          {hasMore && customers.length > 0 && (
            <div className="mt-6 flex justify-center pb-2">
              <Button
                variant="secondary"
                onClick={loadMore}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  'Loading...'
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load More Customers
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {mode === 'create' ? 'Add customer' : 'Edit customer'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Cashier and Admin</div>
            </div>
            {mode === 'edit' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setMode('create');
                  setSelectedId(null);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                New Customer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
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
                      ? 'Customer created successfully'
                      : 'Customer updated successfully',
                  );
                } else {
                  showToast(errorMsg || 'Failed to save customer');
                }
              }}
            />

            {mode === 'edit' && detail && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <div className="text-sm font-semibold mb-3">
                  Recent transactions
                </div>
                {detail.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                          <th className="py-2">ID</th>
                          <th className="py-2">Total</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.transactions.map((t) => (
                          <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800">
                            <td className="py-2 font-mono text-xs">
                              {t.id.slice(0, 8)}
                            </td>
                            <td className="py-2 tabular-nums">
                              {formatIdr(t.totalAmount)}
                            </td>
                            <td className="py-2">
                              <Badge
                                tone={
                                  t.status === 'debt' ? 'danger' : 'success'
                                }
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {t.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-100 rounded-lg p-4 text-center border border-zinc-100 dark:border-zinc-800">
                    No recent transactions
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Toast message={toastMessage} />
    </div>
  );
}
