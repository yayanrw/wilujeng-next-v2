'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { TableLoading } from '@/components/ui/TableLoading';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
import { useToast } from '@/hooks/useToast';
import { UserForm, type UserDto } from './UserForm';
import { useTranslation } from '@/i18n/useTranslation';

export function UsersSettings() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { showToast, Toast } = useToast();
  const LIMIT = 50;
  const { t } = useTranslation();

  const selected = useMemo(
    () =>
      (Array.isArray(users) ? users.find((u) => u.id === selectedId) : null) ??
      null,
    [users, selectedId],
  );

  const fetchUsers = useCallback(
    async (q: string, p: number, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.append('search', q);
        params.append('limit', LIMIT.toString());
        params.append('offset', (p * LIMIT).toString());

        const res = await fetch(`/api/users?${params.toString()}`);
        const body = await res.json().catch(() => []);

        const newUsers = Array.isArray(body) ? body : [];

        setHasMore(newUsers.length === LIMIT);

        if (append) {
          setUsers((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const existingIds = new Set(safePrev.map((item) => item.id));
            return [
              ...safePrev,
              ...newUsers.filter((item: UserDto) => !existingIds.has(item.id)),
            ];
          });
        } else {
          setUsers(newUsers);
        }
      } catch (err) {
        console.error(err);
        if (!append) setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [LIMIT],
  );

  const refresh = useCallback(async () => {
    setPage(0);
    await fetchUsers(search, 0, false);
  }, [fetchUsers, search]);

  useEffect(() => {
    void fetchUsers('', 0, false);
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    setPage(0);
    const timer = window.setTimeout(
      () => void fetchUsers(search, 0, false),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [search, fetchUsers]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(search, nextPage, true);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">{t.settings.users}</div>
          <div className="mt-3">
            <SearchInput
              placeholder={t.settings.searchUsers}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-zinc-900 dark:text-zinc-100">
                    {t.settings.email}
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-zinc-900 dark:text-zinc-100">
                    {t.settings.name}
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-zinc-900 dark:text-zinc-100">
                    {t.settings.role}
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {t.common.action}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  <TableLoading colSpan={4} message={t.settings.loadingUsers} />
                ) : users.length === 0 ? (
                  <TableEmpty colSpan={4} message={t.settings.noUsers} />
                ) : (
                  Array.isArray(users) &&
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-b border-zinc-200 dark:border-zinc-800 ${
                        u.id === selectedId
                          ? 'bg-zinc-50 dark:bg-zinc-900'
                          : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
                      }`}
                    >
                      <td className="py-3 px-4 align-middle">
                        <button
                          type="button"
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={() => {
                            setSelectedId(u.id);
                            setMode('edit');
                          }}
                        >
                          {u.email}
                        </button>
                      </td>
                      <td className="py-3 px-4 align-middle text-zinc-900 dark:text-zinc-100">
                        {u.name ?? '-'}
                      </td>
                      <td className="py-3 px-4 align-middle text-zinc-900 dark:text-zinc-100">
                        {u.role}
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                          onClick={() => {
                            setSelectedId(u.id);
                            setMode('edit');
                          }}
                          title={t.settings.editUser}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">{t.common.edit}</span>
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
            hasMore={hasMore}
            label={t.settings.loadMore}
          />
        </CardContent>
      </Card>

      <Card className="h-fit sticky top-4">
        <CardHeader>
          <div className="text-sm font-semibold">
            {mode === 'create' ? t.settings.createUser : t.settings.editUser}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'create'
              ? t.settings.createUserDesc
              : t.settings.editUserDesc}
          </div>
        </CardHeader>
        <CardContent>
          <UserForm
            mode={mode}
            initial={selected}
            onSuccess={() => {
              if (mode === 'create') {
                setMode('create');
                setSelectedId(null);
                setSearch(''); // Reset search to see new user
                refresh();
              } else {
                setMode('create');
                setSelectedId(null);
                refresh();
              }
            }}
            showToast={showToast}
            onCancelEdit={() => {
              setMode('create');
              setSelectedId(null);
            }}
          />
        </CardContent>
      </Card>

      <Toast />
    </div>
  );
}
