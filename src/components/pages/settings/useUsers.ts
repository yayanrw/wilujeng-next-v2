'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useToast } from '@/hooks/useToast';
import type { UserDto } from './UserForm';

export type UserStats = {
  total: number;
  admins: number;
  cashiers: number;
  newThisMonth: number;
  activeSessions: number;
};

export type UserStatFilter = 'admin' | 'cashier' | 'new_this_month';

export function useUsers() {
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  const [editId, setEditId] = useState<string | null>(null);
  const [statFilter, setStatFilter] = useState<UserStatFilter | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/users/stats');
      if (res.ok) setStats((await res.json()) as UserStats);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const toggleStatFilter = useCallback((f: UserStatFilter) => {
    setStatFilter((prev) => (prev === f ? null : f));
  }, []);

  const fetchFn = useCallback(
    async ({ search, offset, limit }: { search: string; offset: number; limit: number }) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statFilter === 'admin' || statFilter === 'cashier') params.append('role', statFilter);
      if (statFilter === 'new_this_month') params.append('filter', 'new_this_month');
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      const res = await fetch(`/api/users?${params.toString()}`);
      return res.json().catch(() => []) as Promise<UserDto[]>;
    },
    [statFilter],
  );

  const { items: users, loading, hasMore, search, setSearch, loadMore, refresh } =
    usePaginatedList<UserDto>({ fetchFn, limit: 50 });

  const selected = useMemo(
    () => (editId ? (users.find((u) => u.id === editId) ?? null) : null),
    [users, editId],
  );

  const handleSaved = useCallback(
    (success: boolean, errorMsg?: string) => {
      if (success) {
        const wasEdit = !!editId;
        if (editId) setEditId(null);
        refresh();
        void fetchStats();
        showToast(wasEdit ? t.settings.updatedSuccess : t.settings.createdSuccess);
      } else {
        showToast(errorMsg ?? t.settings.saveFailed);
      }
    },
    [editId, refresh, fetchStats, showToast, t],
  );

  return {
    users, loading, hasMore, search, setSearch, loadMore,
    editId, setEditId, selected,
    stats, statsLoading, statFilter, setStatFilter, toggleStatFilter,
    handleSaved,
    t, Toast,
  };
}
