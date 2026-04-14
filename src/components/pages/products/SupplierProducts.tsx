'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { TableLoading } from '@/components/ui/TableLoading';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';

export function SupplierProducts() {
  const { t } = useTranslation();
  const tp =
    (t as unknown as Record<string, Record<string, string>>).products ?? {};

  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast, Toast } = useToast();
  const LIMIT = 50;
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Debounced search to match UsersSettings behaviour
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 500);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [items, debouncedSearch]);

  const display = useMemo(() => {
    const start = page * LIMIT;
    return filtered.slice(start, start + LIMIT);
  }, [filtered, page]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const hasMore = filtered.length > (page + 1) * LIMIT;

  function openDelete(id: string) {
    setDeletingId(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/suppliers/${deletingId}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          body?.message ||
          tp.supplierInUse ||
          tp.deleteFailed ||
          'Unable to delete';
        showToast(msg);
      } else {
        setItems((prev) => prev.filter((s) => s.id !== deletingId));
        showToast(tp.deletedSuccess || 'Deleted');
      }
    } catch (err) {
      console.error(err);
      showToast(tp.deleteFailed || 'Delete failed');
    } finally {
      setBusy(false);
      setConfirmOpen(false);
      setDeletingId(null);
    }
  }

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setPage((p) => p + 1);
  }, [hasMore]);

  return (
    <Card>
      <CardHeader>
        <div className="text-lg font-semibold">
          {tp.suppliersTitle ?? 'Suppliers'}
        </div>
        <div className="mt-3">
          <SearchInput
            placeholder={t.common?.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-zinc-900 dark:text-zinc-100">
                  {tp.supplierName ?? t.common.name}
                </th>
                <th className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {t.common.action}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <TableLoading colSpan={2} message={t.common.loading} />
              ) : display.length === 0 ? (
                <TableEmpty colSpan={2} message={t.common.noData} />
              ) : (
                display.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-200 hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                  >
                    <td className="py-3 px-4 align-middle text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        onClick={() => openDelete(c.id)}
                        title={t.common.delete}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">{t.common.delete}</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <LoadMoreButton
          onClick={loadMore}
          hasMore={hasMore}
          label={t.settings?.loadMore ?? 'Load more'}
        />
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        title={tp.deleteConfirmTitle ?? 'Delete'}
        description={tp.deleteSupplierConfirmDesc}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onClose={() => {
          setConfirmOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        loading={busy}
      />

      <Toast />
    </Card>
  );
}
