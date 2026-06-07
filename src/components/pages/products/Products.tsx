'use client';

import { useCallback, useMemo, useState } from 'react';

import { Plus, Pencil, ToggleRight, ToggleLeft, Trash, PackagePlus, MoreHorizontal, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { TableLoading } from '@/components/ui/TableLoading';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useToast } from '@/hooks/useToast';

import { ProductDto, ProductForm } from './ProductForm';
import { ProductFilters } from './ProductFilters';
import { ImportProductModal } from './ImportProductModal';
import { QuickStockInModal } from './QuickStockInModal';

export function Products({
  statFilter,
  onProductChanged,
}: {
  statFilter?: string;
  onProductChanged?: () => void;
}) {
  const [categoryId, setCategoryId] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [quickStockInProduct, setQuickStockInProduct] = useState<ProductDto | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  const fetchFn = useCallback(
    async ({ search, offset, limit }: { search: string; offset: number; limit: number }) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryId !== 'all') params.append('categoryId', categoryId);
      if (brandId !== 'all') params.append('brandId', brandId);
      if (statFilter) params.append('filter', statFilter);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      const res = await fetch(`/api/products?${params.toString()}`);
      return res.json().catch(() => []) as Promise<ProductDto[]>;
    },
    [categoryId, brandId, statFilter],
  );

  const { items: products, loading, hasMore, search, setSearch, loadMore, refresh } =
    usePaginatedList<ProductDto>({ fetchFn, limit: 50 });

  const selected = useMemo(
    () => (editId ? (products.find((p) => p.id === editId) ?? null) : null),
    [products, editId],
  );

  const handleStatusChange = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}/status`, { method: 'PATCH' });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && (body.status === 'success' || body.updated === true);
      if (ok) {
        refresh();
        onProductChanged?.();
        showToast(t.products.updatedSuccess);
      } else {
        showToast(t.products.saveFailed);
      }
    } catch {
      showToast(t.products.saveFailed);
    }
  }, [refresh, onProductChanged, showToast, t]);

  function openDeleteDialog(id: string) {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deletingId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && (body.deleted === true || body.deleted === 'true');
      if (ok) {
        if (deletingId === editId) setEditId(null);
        refresh();
        onProductChanged?.();
        showToast(t.products.deletedSuccess);
      } else {
        showToast(t.products.deleteFailed);
      }
    } catch {
      showToast(t.products.deleteFailed);
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] min-w-0 overflow-x-hidden">
      {/* Overlay to close mobile action menu on outside click */}
      {actionMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />
      )}

      <Card className="h-fit min-w-0">
        <CardHeader className="flex flex-col gap-4 pb-6">
          <div className="space-y-1.5">
            <div className="text-xl font-bold tracking-tight">
              {t.products.title}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {!loading && products.length > 0
                ? `${products.length}${hasMore ? '+' : ''} ${t.products.productsLoaded}`
                : t.products.subtitle}
            </div>
          </div>
          <ProductFilters
            search={search}
            onSearchChange={setSearch}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            brandId={brandId}
            onBrandChange={setBrandId}
            onImport={() => setIsImportModalOpen(true)}
          />
        </CardHeader>
        <CardContent className="p-0 min-w-0">
          <div className="relative">
            {/* Stale-data overlay: shown when re-fetching while old rows are still visible */}
            {loading && products.length > 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-md text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t.products.loading}
                </div>
              </div>
            )}
          <div className="w-full max-w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-medium">{t.products.sku}</th>
                  <th className="py-3 px-4 font-medium">{t.products.name}</th>
                  <th className="py-3 px-4 font-medium">{t.products.price}</th>
                  <th className="py-3 px-4 font-medium hidden sm:table-cell">{t.products.stock}</th>
                  <th className="py-3 px-4 font-medium hidden sm:table-cell">{t.products.active}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.products.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading && products.length === 0 ? (
                  <TableLoading colSpan={6} message={t.products.loading} />
                ) : products.length === 0 ? (
                  <TableEmpty
                    colSpan={6}
                    message={statFilter ? t.products.noProductsInFilter : t.products.noProducts}
                  />
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className={`group transition-colors border-l-2 ${
                        p.id === editId
                          ? 'border-l-zinc-900 dark:border-l-zinc-100 bg-zinc-50 dark:bg-zinc-900'
                          : 'border-l-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
                      }`}
                    >
                      <td className="py-3 px-4 align-middle">
                        <button
                          type="button"
                          className="font-mono text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          onClick={() => setEditId(p.id)}
                        >
                          {p.sku}
                        </button>
                      </td>
                      <td className="py-3 px-4 align-middle min-w-0">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                              {p.name}
                            </span>
                            {p.minStockThreshold > 0 && p.stock <= p.minStockThreshold ? (
                              <Badge tone="warning" className="h-5 px-1.5 py-0 text-[10px]">
                                {t.products.lowStock}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {p.category ? <span>{p.category.name}</span> : null}
                            {p.category && p.brand ? (
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            ) : null}
                            {p.brand ? <span>{p.brand.name}</span> : null}
                            <span className="sm:hidden text-zinc-300 dark:text-zinc-700">•</span>
                            <span className={`sm:hidden ${p.stock <= 0 ? 'text-red-500 dark:text-red-400' : ''}`}>
                              {t.products.stock} {p.stock}
                            </span>
                            <span className="sm:hidden text-zinc-300 dark:text-zinc-700">•</span>
                            <span className={`sm:hidden ${p.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                              {p.isActive ? t.products.active : t.products.notActive}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatIdr(p.basePrice)}
                      </td>
                      <td className="py-3 px-4 align-middle hidden sm:table-cell">
                        <Badge tone={p.stock <= 0 ? 'danger' : 'neutral'} className="tabular-nums font-semibold">
                          {p.stock}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-middle hidden sm:table-cell">
                        {p.isActive ? (
                          <Badge tone="success">{t.products.active}</Badge>
                        ) : (
                          <Badge tone="danger">{t.products.notActive}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        {/* Desktop: all buttons inline */}
                        <div className="hidden sm:flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            onClick={() => setQuickStockInProduct(p)}
                            title={t.products.quickStockIn}
                          >
                            <PackagePlus className="h-4 w-4" />
                            <span className="sr-only">{t.products.quickStockIn}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            title={p.isActive ? t.products.deactivate : t.products.activate}
                            onClick={() => handleStatusChange(p.id)}
                          >
                            {p.isActive ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            onClick={() => setEditId(p.id)}
                            title={t.products.editProduct}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">{t.common.edit}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            onClick={() => openDeleteDialog(p.id)}
                            title={t.common.delete}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">{t.common.delete}</span>
                          </Button>
                        </div>

                        {/* Mobile: … dropdown menu */}
                        <div className="sm:hidden relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            onClick={() => setActionMenuId(actionMenuId === p.id ? null : p.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                          {actionMenuId === p.id && (
                            <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl py-1">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                onClick={() => { setQuickStockInProduct(p); setActionMenuId(null); }}
                              >
                                <PackagePlus className="h-4 w-4 text-zinc-400 shrink-0" />
                                {t.products.quickStockIn}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                onClick={() => { void handleStatusChange(p.id); setActionMenuId(null); }}
                              >
                                {p.isActive
                                  ? <ToggleRight className="h-4 w-4 text-zinc-400 shrink-0" />
                                  : <ToggleLeft className="h-4 w-4 text-zinc-400 shrink-0" />}
                                {p.isActive ? t.products.deactivate : t.products.activate}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                onClick={() => { setEditId(p.id); setActionMenuId(null); }}
                              >
                                <Pencil className="h-4 w-4 text-zinc-400 shrink-0" />
                                {t.common.edit}
                              </button>
                              <div className="mx-2 my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                              <button
                                type="button"
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                onClick={() => { openDeleteDialog(p.id); setActionMenuId(null); }}
                              >
                                <Trash className="h-4 w-4 shrink-0" />
                                {t.common.delete}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>{/* end relative wrapper */}

          <LoadMoreButton
            onClick={loadMore}
            hasMore={hasMore && products.length > 0 && !loading}
            label={t.products.loadMore}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {editId ? t.products.editProduct : t.products.newProduct}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.common.adminOnly}
              </div>
            </div>
            {editId && (
              <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>
                <Plus className="h-3 w-3 mr-1" />
                {t.products.newProduct}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProductForm
            mode={editId ? 'edit' : 'create'}
            initial={editId ? (selected ?? undefined) : undefined}
            onSaved={(success, errorMsg) => {
              if (success) {
                const wasEdit = !!editId;
                if (editId) setEditId(null);
                refresh();
                onProductChanged?.();
                showToast(wasEdit ? t.products.updatedSuccess : t.products.createdSuccess);
              } else {
                showToast(errorMsg || t.products.saveFailed);
              }
            }}
          />
        </CardContent>
      </Card>

      {quickStockInProduct && (
        <QuickStockInModal
          open
          productId={quickStockInProduct.id}
          productName={quickStockInProduct.name}
          currentStock={quickStockInProduct.stock}
          currentBuyPrice={quickStockInProduct.buyPrice}
          onSuccess={() => {
            setQuickStockInProduct(null);
            refresh();
            onProductChanged?.();
            showToast(t.products.quickStockInSuccess);
          }}
          onClose={() => setQuickStockInProduct(null)}
        />
      )}

      <ImportProductModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          setIsImportModalOpen(false);
          refresh();
          onProductChanged?.();
        }}
      />
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={t.products.deleteConfirmTitle}
        description={t.products.deleteConfirmDesc}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        loading={deleting}
      />
      <Toast />
    </div>
  );
}
