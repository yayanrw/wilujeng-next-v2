'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
          <Input
            placeholder={t.products?.searchPlaceholder ?? 'Search'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {t.common.loading}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {display.length === 0 ? (
              <div className="text-sm text-zinc-500">{t.common.noData}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                    <th className="py-2">{tp.supplierName ?? t.common.name}</th>
                    <th className="py-2 text-right">{t.common.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {display.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4 align-middle">{c.name}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          onClick={() => openDelete(c.id)}
                          title={t.common.delete}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">{t.common.delete}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" onClick={loadMore} disabled={false}>
              {t.settings?.loadMore ?? 'Load more'}
            </Button>
          </div>
        )}
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
