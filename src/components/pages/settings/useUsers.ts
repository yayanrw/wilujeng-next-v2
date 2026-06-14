'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useToast } from '@/hooks/useToast';
import type { UserDto } from './UserForm';

export function useUsers() {
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  const [editId, setEditId] = useState<string | null>(null);

  const fetchFn = useCallback(
    async ({ search, offset, limit }: { search: string; offset: number; limit: number }) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      const res = await fetch(`/api/users?${params.toString()}`);
      return res.json().catch(() => []) as Promise<UserDto[]>;
    },
    [],
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
        showToast(wasEdit ? t.settings.updatedSuccess : t.settings.createdSuccess);
      } else {
        showToast(errorMsg ?? t.settings.saveFailed);
      }
    },
    [editId, refresh, showToast, t],
  );

  return {
    users, loading, hasMore, search, setSearch, loadMore,
    editId, setEditId, selected,
    handleSaved,
    t, Toast,
  };
}
