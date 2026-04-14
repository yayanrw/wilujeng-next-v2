'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Plus, Pencil, ToggleRight, ToggleLeft, Trash } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { TableLoading } from '@/components/ui/TableLoading';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
import { formatIdr } from '@/utils/money';

import { useTranslation } from '@/i18n/useTranslation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductDto, ProductForm } from './ProductForm';
import { useToast } from '@/hooks/useToast';
import { ImportProductModal } from './ImportProductModal';

export function Products() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { showToast, Toast } = useToast();
  const [categoryId, setCategoryId] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { t } = useTranslation();
  const LIMIT = 50;

  const selected = useMemo(
    () =>
      selectedId ? (products.find((p) => p.id === selectedId) ?? null) : null,
    [products, selectedId],
  );

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);

    fetch('/api/brands')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBrands(data);
      })
      .catch(console.error);
  }, []);

  async function fetchProducts(
    q: string,
    cat: string,
    brnd: string,
    p: number,
    append = false,
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      if (cat && cat !== 'all') params.append('categoryId', cat);
      if (brnd && brnd !== 'all') params.append('brandId', brnd);
      params.append('limit', LIMIT.toString());
      params.append('offset', (p * LIMIT).toString());

      const res = await fetch(`/api/products?${params.toString()}`);
      const body = (await res.json().catch(() => [])) as ProductDto[];

      setHasMore(body.length === LIMIT);

      if (append) {
        setProducts((prev) => {
          // Filter out duplicates if any (shouldn't happen with strict offset, but good for safety)
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...body.filter((item) => !existingIds.has(item.id))];
        });
      } else {
        setProducts(body);
      }
    } catch (err) {
      console.error(err);
      if (!append) setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const refresh = useCallback(async () => {
    setPage(0);
    await fetchProducts(search, categoryId, brandId, 0, false);
  }, [search, categoryId, brandId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(0);
    const t = window.setTimeout(
      () => void fetchProducts(search, categoryId, brandId, 0, false),
      500, // Increased debounce to 500ms
    );
    return () => window.clearTimeout(t);
  }, [search, categoryId, brandId]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(search, categoryId, brandId, nextPage, true);
  };

  async function handleStatusChange(id: string) {
    try {
      const res = await fetch(`/api/products/${id}/status`, {
        method: 'PATCH',
      });
      const body = await res.json().catch(() => ({}));

      // Accept either { status: 'success' } or { updated: true } (your route.ts returns { updated: true })
      const ok = res.ok && (body.status === 'success' || body.updated === true);

      if (ok) {
        // Optimistically update local state so the toggle changes immediately
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
        );
        showToast(t.products.updatedSuccess);
      } else {
        showToast(t.products.saveFailed);
      }
    } catch (err) {
      console.error(err);
      showToast(t.products.saveFailed);
    }
  }

  function openDeleteDialog(id: string) {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deletingId}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && (body.deleted === true || body.deleted === 'true');
      if (ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deletingId));
        showToast(t.products.deletedSuccess || 'Deleted');
      } else {
        showToast(t.products.deleteFailed || t.products.saveFailed);
      }
    } catch (err) {
      console.error(err);
      showToast(t.products.deleteFailed || t.products.saveFailed);
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      <Card className="h-fit">
        <CardHeader className="flex flex-col gap-4 pb-6">
          <div className="space-y-1.5">
            <div className="text-xl font-bold tracking-tight">
              {t.products.title}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {t.products.subtitle}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <SearchInput
              placeholder={t.products.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              wrapperClassName="flex-1"
            />
            <div className="flex gap-3 w-full sm:w-auto">
              <select
                className="flex h-10 w-full sm:w-45 items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="all">{t.common.allCategories}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                className="flex h-10 w-full sm:w-45 items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="all">{t.common.allBrands}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                className="h-10 whitespace-nowrap bg-white dark:bg-zinc-950"
                onClick={() => setIsImportModalOpen(true)}
              >
                {t.products.importProducts || 'Import'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-medium">{t.products.sku}</th>
                  <th className="py-3 px-4 font-medium">{t.products.name}</th>
                  <th className="py-3 px-4 font-medium">
                    {t.products.price}
                  </th>
                  <th className="py-3 px-4 font-medium">
                    {t.products.stock}
                  </th>
                  <th className="py-3 px-4 font-medium">
                    {t.products.active}
                  </th>
                  <th className="py-3 px-4 font-medium text-right">
                    {t.products.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading && products.length === 0 ? (
                  <TableLoading colSpan={6} message={t.products.loading} />
                ) : products.length === 0 ? (
                  <TableEmpty colSpan={6} message={t.products.noProducts} />
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className={`group transition-colors ${
                        p.id === selectedId
                          ? 'bg-zinc-50 dark:bg-zinc-900'
                          : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
                      }`}
                    >
                      <td className="py-3 px-4 align-middle">
                        <button
                          type="button"
                          className="font-mono text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          onClick={() => {
                            setSelectedId(p.id);
                            setMode('edit');
                          }}
                        >
                          {p.sku}
                        </button>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                              {p.name}
                            </span>
                            {p.minStockThreshold > 0 &&
                            p.stock <= p.minStockThreshold ? (
                              <Badge
                                tone="warning"
                                className="h-5 px-1.5 py-0 text-[10px]"
                              >
                                {t.products.lowStock}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {p.category ? <span>{p.category.name}</span> : null}
                            {p.category && p.brand ? (
                              <span className="text-zinc-300 dark:text-zinc-700">
                                •
                              </span>
                            ) : null}
                            {p.brand ? <span>{p.brand.name}</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatIdr(p.basePrice)}
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <Badge
                          tone={p.stock <= 0 ? 'danger' : 'neutral'}
                          className="tabular-nums font-semibold"
                        >
                          {p.stock}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        {p.isActive ? (
                          <Badge tone="success">{t.products.active}</Badge>
                        ) : (
                          <Badge tone="danger">{t.products.notActive}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          size="sm"
                          title={
                            p.isActive
                              ? t.products.deactivate
                              : t.products.activate
                          }
                          onClick={() => {
                            handleStatusChange(p.id);
                          }}
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
                          onClick={() => {
                            setSelectedId(p.id);
                            setMode('edit');
                          }}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <LoadMoreButton
            onClick={loadMore}
            hasMore={hasMore && products.length > 0}
            label={t.products.loadMore}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {mode === 'create'
                  ? t.products.newProduct
                  : t.products.editProduct}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.common.adminOnly}
              </div>
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
                {t.products.newProduct}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProductForm
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
                    ? t.products.createdSuccess
                    : t.products.updatedSuccess,
                );
              } else {
                showToast(errorMsg || t.products.saveFailed);
              }
            }}
          />
        </CardContent>
      </Card>
      <ImportProductModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          setIsImportModalOpen(false);
          refresh();
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
