'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { UserForm } from './UserForm';
import { UsersFilters } from './UsersFilters';
import { UsersTable } from './UsersTable';
import { useUsers } from './useUsers';

export function UsersSettings() {
  const {
    users, loading, hasMore, search, setSearch, loadMore,
    editId, setEditId, selected,
    handleSaved,
    t, Toast,
  } = useUsers();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] min-w-0 overflow-x-hidden">
      <Card className="h-fit min-w-0">
        <CardHeader className="flex flex-col gap-4 pb-6">
          <div className="space-y-1.5">
            <div className="text-xl font-bold tracking-tight">{t.settings.userManagement}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {!loading && users.length > 0
                ? `${users.length}${hasMore ? '+' : ''} ${t.settings.usersLoaded}`
                : t.settings.userManagementDesc}
            </div>
          </div>
          <UsersFilters search={search} onSearch={setSearch} />
        </CardHeader>
        <CardContent className="p-0 min-w-0">
          <UsersTable
            users={users}
            loading={loading}
            hasMore={hasMore}
            editId={editId}
            onEdit={setEditId}
            onLoadMore={loadMore}
          />
        </CardContent>
      </Card>

      <Card className="h-fit sticky top-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {editId ? t.settings.editUser : t.settings.createUser}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.common.adminOnly}
              </div>
            </div>
            {editId && (
              <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>
                <Plus className="h-3 w-3 mr-1" /> {t.settings.newUser}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <UserForm
            mode={editId ? 'edit' : 'create'}
            initial={editId ? (selected ?? undefined) : undefined}
            onSaved={handleSaved}
          />
        </CardContent>
      </Card>

      <Toast />
    </div>
  );
}
