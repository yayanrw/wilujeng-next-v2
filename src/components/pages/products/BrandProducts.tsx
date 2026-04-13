'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash, Pencil } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function BrandProducts() {
  const { t } = useTranslation();
  const tp =
    (t as unknown as Record<string, Record<string, string>>).products ?? {};

  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast, Toast } = useToast();
  const LIMIT = 50;
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/brands')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBrands(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Debounced search to match UsersSettings behaviour
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const tId = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(tId);
  }, [search]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => (b.name || '').toLowerCase().includes(q));
  }, [brands, debouncedSearch]);

  const display = useMemo(() => {
    const start = page * LIMIT;
    return filtered.slice(start, start + LIMIT);
  }, [filtered, page]);

  useEffect(() => {
    // reset pagination when filter changes
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
      const res = await fetch(`/api/brands/${deletingId}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          body?.message ||
          tp.brandInUse ||
          tp.deleteFailed ||
          'Unable to delete';
        showToast(msg);
      } else {
        setBrands((prev) => prev.filter((b) => b.id !== deletingId));
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

  const onEdit = useCallback(
    (id: string) => {
      // Edit not implemented yet; show a consistent toast and log id to avoid unused var
      // Use existing i18n key for 'edit' to keep messages localized where possible
      console.debug('edit brand', id);
      showToast(`${t.common.edit} not implemented`);
    },
    [showToast, t.common.edit],
  );

  return (
    <Card>
      <CardHeader>
        <div className="text-lg font-semibold">
          {tp.brandsTitle ?? 'Brands'}
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
        {loading ? (
          <div className="text-sm text-zinc-500">{t.common.loading}</div>
        ) : display.length === 0 ? (
          <div className="text-sm text-zinc-500">{t.common.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                  <th className="py-2">{tp.brandName ?? t.common.name}</th>
                  <th className="py-2 text-right">{t.common.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {display.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 px-4 align-middle">{b.name}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => openDelete(b.id)}
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
        title={
          tp.deleteConfirmTitle ?? t.products?.deleteConfirmTitle ?? 'Delete'
        }
        description={tp.deleteBrandConfirmDesc ?? t.products?.deleteConfirmDesc}
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
