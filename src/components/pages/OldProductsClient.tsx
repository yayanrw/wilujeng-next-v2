'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  Pencil,
  Search,
  ToggleRight,
  ToggleLeft,
  Trash,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';

import { ProductForm, type ProductDto } from './products/ProductForm';
import { ImportProductModal } from './products/ImportProductModal';
import { Toast } from './pos/Toast';
import { useTranslation } from '@/i18n/useTranslation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// New: simple Tabs state
type AdminTab = 'products' | 'brands' | 'categories' | 'suppliers';

export function ProductsClient() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { t } = useTranslation();
  const LIMIT = 50;

  // New state for master lists and tab management
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [brandsList, setBrandsList] = useState<{ id: string; name: string }[]>(
    []
  );
  const [catsList, setCatsList] = useState<{ id: string; name: string }[]>([]);
  const [suppliersList, setSuppliersList] = useState<
    { id: string; name: string; phone?: string }[]
  >([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterDeletingId, setMasterDeletingId] = useState<string | null>(null);
  const [masterDeleting, setMasterDeleting] = useState(false);
  const [masterConfirmOpen, setMasterConfirmOpen] = useState(false);
  const [masterDeleteKind, setMasterDeleteKind] = useState<
    'brand' | 'category' | 'supplier' | null
  >(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selected = useMemo(
    () =>
      selectedId ? (products.find((p) => p.id === selectedId) ?? null) : null,
    [products, selectedId]
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
    append = false
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

  async function refresh() {
    setPage(0);
    await fetchProducts(search, categoryId, brandId, 0, false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(0);
    const t = window.setTimeout(
      () => void fetchProducts(search, categoryId, brandId, 0, false),
      500 // Increased debounce to 500ms
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
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

  // Fetch master lists when switching tabs
  useEffect(() => {
    if (
      activeTab === 'brands' ||
      activeTab === 'categories' ||
      activeTab === 'suppliers'
    ) {
      setMasterLoading(true);
      const path =
        activeTab === 'brands'
          ? '/api/brands'
          : activeTab === 'categories'
            ? '/api/categories'
            : '/api/suppliers';
      fetch(path)
        .then((r) => r.json())
        .then((data) => {
          if (activeTab === 'brands' && Array.isArray(data))
            setBrandsList(data);
          if (activeTab === 'categories' && Array.isArray(data))
            setCatsList(data);
          if (activeTab === 'suppliers' && Array.isArray(data))
            setSuppliersList(data);
        })
        .catch(console.error)
        .finally(() => setMasterLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function openMasterDelete(
    kind: 'brand' | 'category' | 'supplier',
    id: string
  ) {
    setMasterDeleteKind(kind);
    setMasterDeletingId(id);
    setMasterConfirmOpen(true);
  }

  async function confirmMasterDelete() {
    if (!masterDeletingId || !masterDeleteKind) return;
    setMasterDeleting(true);
    try {
      const path =
        masterDeleteKind === 'brand'
          ? `/api/brands/${masterDeletingId}`
          : masterDeleteKind === 'category'
            ? `/api/categories/${masterDeletingId}`
            : `/api/suppliers/${masterDeletingId}`;

      const res = await fetch(path, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          body?.message ||
          (masterDeleteKind === 'brand'
            ? t.products.brandInUse
            : masterDeleteKind === 'category'
              ? t.products.categoryInUse
              : t.products.supplierInUse) ||
          t.common.failedToSave;
        showToast(msg);
      } else {
        // remove from local list
        if (masterDeleteKind === 'brand') {
          setBrandsList((prev) =>
            prev.filter((b) => b.id !== masterDeletingId)
          );
          showToast(t.products.deletedSuccess || 'Deleted');
        } else if (masterDeleteKind === 'category') {
          setCatsList((prev) => prev.filter((c) => c.id !== masterDeletingId));
          showToast(t.products.deletedSuccess || 'Deleted');
        } else {
          setSuppliersList((prev) =>
            prev.filter((s) => s.id !== masterDeletingId)
          );
          showToast(t.products.deletedSuccess || 'Deleted');
        }
      }
    } catch (err) {
      console.error(err);
      showToast(t.common.failedToSave);
    } finally {
      setMasterDeleting(false);
      setMasterConfirmOpen(false);
      setMasterDeletingId(null);
      setMasterDeleteKind(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      {/* Tabs — pill style like SettingsClient */}
      <div className="mb-2 flex gap-2">
        {(['products', 'brands', 'categories', 'suppliers'] as AdminTab[]).map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                tab === activeTab
                  ? 'rounded-full bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }
            >
              {t.products[`tab_${tab}`] ?? tab}
            </button>
          )
        )}
      </div>

      {/* If non-products tab, render simple master list */}
      {activeTab !== 'products' ? (
        <Card className="h-fit">
          <CardHeader className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {activeTab === 'brands'
                ? t.products.brandsTitle
                : activeTab === 'categories'
                  ? t.products.categoriesTitle
                  : t.products.suppliersTitle}
            </div>
          </CardHeader>
          <CardContent>
            {masterLoading ? (
              <div className="p-6 text-sm text-zinc-500">
                {t.common.loading}
              </div>
            ) : (
              <div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {(activeTab === 'brands'
                      ? brandsList
                      : activeTab === 'categories'
                        ? catsList
                        : suppliersList
                    ).map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4 align-middle">{item.name}</td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() =>
                              openMasterDelete(
                                activeTab === 'brands'
                                  ? 'brand'
                                  : activeTab === 'categories'
                                    ? 'category'
                                    : 'supplier',
                                item.id
                              )
                            }
                            title={t.common.delete}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">{t.common.delete}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(activeTab === 'brands'
                      ? brandsList
                      : activeTab === 'categories'
                        ? catsList
                        : suppliersList
                    ).length === 0 && (
                      <tr>
                        <td
                          className="py-4 px-4 text-sm text-zinc-500"
                          colSpan={2}
                        >
                          {t.common.noData}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // existing products UI when activeTab === 'products'
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
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <Input
                  placeholder={t.products.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <select
                  className="flex h-10 w-full sm:w-[180px] items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="flex h-10 w-full sm:w-[180px] items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            {loading && products.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {t.products.loading}
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                      <th className="py-3 px-4 font-medium">
                        {t.products.sku}
                      </th>
                      <th className="py-3 px-4 font-medium">
                        {t.products.name}
                      </th>
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
                    {products.map((p) => (
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
                              {p.category ? (
                                <span>{p.category.name}</span>
                              ) : null}
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
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 transition-colors"
                            onClick={() => openDeleteDialog(p.id)}
                            title={t.common.delete}
                          >
                            <span className="sr-only">{t.common.delete}</span>
                            {/* simple X icon */}
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && products.length === 0 ? (
              <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                {t.products.noProducts}
              </div>
            ) : null}

            {hasMore && products.length > 0 && !loading && (
              <div className="mt-6 flex justify-center pb-4">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {t.products.loadMore}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
      <ConfirmDialog
        open={masterConfirmOpen}
        title={t.products.deleteConfirmTitle}
        description={
          masterDeleteKind === 'brand'
            ? t.products.deleteBrandConfirmDesc
            : masterDeleteKind === 'category'
              ? t.products.deleteCategoryConfirmDesc
              : t.products.deleteSupplierConfirmDesc
        }
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onClose={() => {
          setMasterConfirmOpen(false);
          setMasterDeletingId(null);
          setMasterDeleteKind(null);
        }}
        onConfirm={confirmMasterDelete}
        loading={masterDeleting}
      />
      <Toast message={toastMessage} />
    </div>
  );
}
