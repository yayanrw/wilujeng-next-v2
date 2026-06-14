'use client';

import { useCallback, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useToast } from '@/hooks/useToast';

export interface Category {
  id: string;
  name: string;
}

export function useCategoryProducts() {
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFn = useCallback(
    async ({ search }: { search: string; offset: number; limit: number }) => {
      const params = new URLSearchParams({ all: '1' });
      if (search) params.append('search', search);
      const res = await fetch(`/api/categories?${params}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? (data as Category[]) : [];
    },
    [],
  );

  const { items: categories, loading, hasMore, search, setSearch, loadMore, refresh } =
    usePaginatedList<Category>({ fetchFn, limit: 50 });

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
      const res = await fetch(`/api/categories/${deletingId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(body?.message || t.products.categoryInUse || t.products.deleteFailed);
      } else {
        refresh();
        showToast(t.products.categoryDeletedSuccess);
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
    categories,
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
