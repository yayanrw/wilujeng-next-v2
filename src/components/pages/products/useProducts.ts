'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useToast } from '@/hooks/useToast';

import type { ProductDto } from './ProductForm';

export type SortField = 'name' | 'basePrice' | 'stock';

interface UseProductsOptions {
  statFilter?: string;
  onProductChanged?: () => void;
}

export function useProducts({ statFilter, onProductChanged }: UseProductsOptions) {
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  const [categoryId, setCategoryId] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editId, setEditId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [quickStockInProduct, setQuickStockInProduct] = useState<ProductDto | null>(null);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const fetchFn = useCallback(
    async ({ search, offset, limit }: { search: string; offset: number; limit: number }) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryId !== 'all') params.append('categoryId', categoryId);
      if (brandId !== 'all') params.append('brandId', brandId);
      if (statFilter) params.append('filter', statFilter);
      params.append('sort', sortField);
      params.append('order', sortDir);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      const res = await fetch(`/api/products?${params.toString()}`);
      return res.json().catch(() => []) as Promise<ProductDto[]>;
    },
    [categoryId, brandId, statFilter, sortField, sortDir],
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

  const openDeleteDialog = useCallback((id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  }, []);

  const confirmDelete = useCallback(async () => {
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
  }, [deletingId, editId, refresh, onProductChanged, showToast, t]);

  const handleSaved = useCallback((success: boolean, errorMsg?: string) => {
    if (success) {
      const wasEdit = !!editId;
      if (editId) setEditId(null);
      refresh();
      onProductChanged?.();
      showToast(wasEdit ? t.products.updatedSuccess : t.products.createdSuccess);
    } else {
      showToast(errorMsg || t.products.saveFailed);
    }
  }, [editId, refresh, onProductChanged, showToast, t]);

  const handleQuickStockInSuccess = useCallback(() => {
    setQuickStockInProduct(null);
    refresh();
    onProductChanged?.();
    showToast(t.products.quickStockInSuccess);
  }, [refresh, onProductChanged, showToast, t]);

  const handleImportSuccess = useCallback((msg: string) => {
    showToast(msg);
    setIsImportModalOpen(false);
    refresh();
    onProductChanged?.();
  }, [refresh, onProductChanged, showToast]);

  return {
    // data
    products, loading, hasMore, search, setSearch, loadMore, refresh,
    // filter
    categoryId, setCategoryId, brandId, setBrandId,
    // sort
    sortField, sortDir, handleSort,
    // edit
    editId, setEditId, selected,
    // delete
    isDeleteDialogOpen, openDeleteDialog, closeDeleteDialog, confirmDelete, deleting,
    handleStatusChange,
    // quick stock-in
    quickStockInProduct, setQuickStockInProduct, handleQuickStockInSuccess,
    // import
    isImportModalOpen, setIsImportModalOpen, handleImportSuccess,
    // form save
    handleSaved,
    // i18n + toast (needed by the coordinator for rendering)
    t, Toast,
  };
}
