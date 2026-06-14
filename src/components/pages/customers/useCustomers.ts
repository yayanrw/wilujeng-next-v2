'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/i18n/useTranslation';

import type { CustomerDto } from './CustomerForm';

export type CustomerSortField = 'name' | 'points' | 'totalDebt';

export type CustomerDetail = {
  customer: CustomerDto;
  transactions: Array<{
    id: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }>;
};

export function useCustomers() {
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  const [sortField, setSortField] = useState<CustomerSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editId, setEditId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [payDebtCustomer, setPayDebtCustomer] = useState<{
    id: string;
    name: string;
    totalDebt: number;
  } | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);

  const handleSort = useCallback(
    (field: CustomerSortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  const fetchFn = useCallback(
    async ({
      search,
      offset,
      limit,
    }: {
      search: string;
      offset: number;
      limit: number;
    }) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('sortBy', sortField);
      params.append('sortOrder', sortDir);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      const res = await fetch(`/api/customers?${params.toString()}`);
      return res.json().catch(() => []) as Promise<CustomerDto[]>;
    },
    [sortField, sortDir],
  );

  const {
    items: customers,
    loading,
    hasMore,
    search,
    setSearch,
    loadMore,
    refresh,
  } = usePaginatedList<CustomerDto>({ fetchFn, limit: 50 });

  const selected = useMemo(
    () => (editId ? (customers.find((c) => c.id === editId) ?? null) : null),
    [customers, editId],
  );

  useEffect(() => {
    if (!editId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void fetch(`/api/customers/${editId}`)
      .then((r) => r.json())
      .then((d: CustomerDetail & { error?: unknown }) => {
        if (!cancelled && !d.error) setDetail(d as CustomerDetail);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [editId]);

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
      const res = await fetch(`/api/customers/${deletingId}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && (body.deleted === true || body.deleted === 'true');
      if (ok) {
        if (deletingId === editId) setEditId(null);
        refresh();
        showToast(t.customers.deletedSuccess);
      } else {
        showToast(t.customers.deleteFailed);
      }
    } catch {
      showToast(t.customers.deleteFailed);
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  }, [deletingId, editId, refresh, showToast, t]);

  const handleSaved = useCallback(
    (success: boolean, errorMsg?: string) => {
      if (success) {
        const wasEdit = !!editId;
        refresh();
        showToast(wasEdit ? t.customers.updatedSuccess : t.customers.createdSuccess);
        if (wasEdit) setEditId(null);
      } else {
        showToast(errorMsg || t.customers.saveFailed);
      }
    },
    [editId, refresh, showToast, t],
  );

  const handlePayDebt = useCallback(
    async (amount: number, method: string, note: string) => {
      if (!payDebtCustomer) return;
      const res = await fetch(`/api/customers/${payDebtCustomer.id}/pay-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod: method, note }),
      });
      if (res.ok) {
        showToast(t.customers.paymentSuccessful);
        setPayDebtCustomer(null);
        refresh();
        if (editId === payDebtCustomer.id) {
          void fetch(`/api/customers/${editId}`)
            .then((r) => r.json())
            .then((d: CustomerDetail) => setDetail(d))
            .catch(() => {});
        }
      } else {
        const err = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        showToast(err.error?.message || t.customers.paymentFailed);
      }
    },
    [payDebtCustomer, editId, refresh, showToast, t],
  );

  return {
    customers,
    loading,
    hasMore,
    search,
    setSearch,
    loadMore,
    refresh,
    sortField,
    sortDir,
    handleSort,
    editId,
    setEditId,
    selected,
    detail,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    deleting,
    payDebtCustomer,
    setPayDebtCustomer,
    handlePayDebt,
    handleSaved,
    t,
    Toast,
  };
}
