'use client';

import { useCallback, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useToast } from '@/hooks/useToast';

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export function useSupplierProducts() {
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFn = useCallback(
    async ({ search, offset, limit }: { search: string; offset: number; limit: number }) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (search) params.append('search', search);
      const res = await fetch(`/api/suppliers?${params}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? (data as Supplier[]) : [];
    },
    [],
  );

  const { items: suppliers, loading, hasMore, search, setSearch, loadMore, refresh } =
    usePaginatedList<Supplier>({ fetchFn, limit: 50 });

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
      const res = await fetch(`/api/suppliers/${deletingId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(body?.message || t.products.supplierInUse || t.products.deleteFailed);
      } else {
        refresh();
        showToast(t.products.supplierDeletedSuccess);
      }
    } catch {
      showToast(t.products.deleteFailed);
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  }, [deletingId, refresh, showToast, t]);

  return {
    suppliers,
    loading,
    hasMore,
    search,
    setSearch,
    loadMore,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    deleting,
    t,
    Toast,
  };
}
