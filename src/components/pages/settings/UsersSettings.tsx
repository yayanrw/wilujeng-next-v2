'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/pages/pos/Toast';
import { UserForm, type UserDto } from './UserForm';

export function UsersSettings() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const LIMIT = 50;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selected = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId],
  );

  async function fetchUsers(q: string, p: number, append = false) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      params.append('limit', LIMIT.toString());
      params.append('offset', (p * LIMIT).toString());

      const res = await fetch(`/api/users?${params.toString()}`);
      const body = (await res.json().catch(() => [])) as UserDto[];

      setHasMore(body.length === LIMIT);

      if (append) {
        setUsers((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...body.filter((item) => !existingIds.has(item.id))];
        });
      } else {
        setUsers(body);
      }
    } catch (err) {
      console.error(err);
      if (!append) setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setPage(0);
    await fetchUsers(search, 0, false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    setPage(0);
    const t = window.setTimeout(() => void fetchUsers(search, 0, false), 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
          <div className="text-lg font-semibold">Users</div>
          <div className="mt-3">
            <Input
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Loading users...
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                    <th className="py-2">Email</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Role</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className={
                        u.id === selectedId
                          ? 'border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-100'
                          : 'border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-100'
                      }
                    >
                      <td className="py-2">
                        <button
                          type="button"
                          className="font-medium hover:underline"
                          onClick={() => {
                            setSelectedId(u.id);
                            setMode('edit');
                          }}
                        >
                          {u.email}
                        </button>
                      </td>
                      <td className="py-2">{u.name ?? '-'}</td>
                      <td className="py-2">{u.role}</td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-50"
                          onClick={() => {
                            setSelectedId(u.id);
                            setMode('edit');
                          }}
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-zinc-500 dark:text-zinc-400"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit sticky top-4">
        <CardHeader>
          <div className="text-sm font-semibold">
            {mode === 'create' ? 'Create User' : 'Edit User'}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'create'
              ? 'Add a new cashier or admin'
              : 'Update user details'}
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

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
