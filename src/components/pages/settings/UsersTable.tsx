'use client';

import { Loader2, MoreHorizontal, Pencil } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { TableLoading } from '@/components/ui/TableLoading';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
import { useTranslation } from '@/i18n/useTranslation';
import type { UserDto } from './UserForm';

interface Props {
  users: UserDto[];
  loading: boolean;
  hasMore: boolean;
  editId: string | null;
  onEdit: (id: string) => void;
  onLoadMore: () => void;
}

export function UsersTable({ users, loading, hasMore, editId, onEdit, onLoadMore }: Props) {
  const { t } = useTranslation();
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  return (
    <>
      {actionMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />
      )}

      <div className="relative">
        {loading && users.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-md text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.settings.loadingUsers}
            </div>
          </div>
        )}

        <div className="w-full max-w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4 font-medium">{t.settings.email}</th>
                <th className="py-3 px-4 font-medium">{t.settings.name}</th>
                <th className="py-3 px-4 font-medium hidden sm:table-cell">{t.settings.role}</th>
                <th className="py-3 px-4 font-medium text-right">{t.common.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading && users.length === 0 ? (
                <TableLoading colSpan={4} message={t.settings.loadingUsers} />
              ) : users.length === 0 ? (
                <TableEmpty colSpan={4} message={t.settings.noUsers} />
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={`group transition-colors border-l-2 ${
                      u.id === editId
                        ? 'border-l-zinc-900 dark:border-l-zinc-100 bg-zinc-50 dark:bg-zinc-900'
                        : 'border-l-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <td className="py-3 px-4 align-middle">
                      <button
                        type="button"
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => onEdit(u.id)}
                      >
                        {u.email}
                      </button>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 sm:hidden mt-0.5">
                        {u.role}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle text-zinc-900 dark:text-zinc-100">
                      {u.name ?? '-'}
                    </td>
                    <td className="py-3 px-4 align-middle text-zinc-900 dark:text-zinc-100 hidden sm:table-cell">
                      {u.role}
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      {/* Desktop */}
                      <div className="hidden sm:flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          onClick={() => onEdit(u.id)}
                          title={t.settings.editUser}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Mobile */}
                      <div className="sm:hidden relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          onClick={() =>
                            setActionMenuId(actionMenuId === u.id ? null : u.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {actionMenuId === u.id && (
                          <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl py-1">
                            <button
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                              onClick={() => {
                                onEdit(u.id);
                                setActionMenuId(null);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-zinc-400 shrink-0" /> {t.common.edit}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LoadMoreButton
        onClick={onLoadMore}
        hasMore={hasMore && users.length > 0 && !loading}
        label={t.settings.loadMore}
      />
    </>
  );
}
