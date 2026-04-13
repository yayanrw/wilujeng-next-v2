'use client';

import { useEffect, useState } from 'react';
import { Trash } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

export function CategoryProducts() {
  const { t } = useTranslation();
  // safer typed access for nested translations
  const tp =
    (t as unknown as Record<string, Record<string, string>>).products ?? {};
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast, Toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function openDelete(id: string) {
    setDeletingId(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/categories/${deletingId}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body?.message || tp.categoryInUse || 'Unable to delete';
        showToast(msg);
      } else {
        setItems((prev) => prev.filter((c) => c.id !== deletingId));
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

  return (
    <div>
      <h2 className="text-lg font-semibold">
        {tp.categoriesTitle ?? 'Categories'}
      </h2>
      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-zinc-500">{t.common.loading}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-zinc-500">{t.common.noData}</div>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4 align-middle">{c.name}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      onClick={() => openDelete(c.id)}
                      title={t.common.delete}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">{t.common.delete}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={tp.deleteConfirmTitle ?? 'Delete'}
        description={tp.deleteCategoryConfirmDesc}
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
    </div>
  );
}
