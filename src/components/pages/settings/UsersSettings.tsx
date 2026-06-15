'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/shared/StatCard';
import { UserForm } from './UserForm';
import { UsersFilters } from './UsersFilters';
import { UsersTable } from './UsersTable';
import { useUsers } from './useUsers';

export function UsersSettings() {
  const {
    users,
    loading,
    hasMore,
    search,
    setSearch,
    loadMore,
    editId,
    setEditId,
    selected,
    stats,
    statsLoading,
    statFilter,
    setStatFilter,
    toggleStatFilter,
    handleSaved,
    t,
    Toast,
  } = useUsers();

  return (
    <div className="flex flex-col gap-4 min-w-0 overflow-x-hidden">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 m-1">
        <StatCard
          label={t.settings.statTotal}
          value={stats?.total ?? 0}
          tone="neutral"
          active={statFilter === null}
          loading={statsLoading}
          onClick={() => setStatFilter(null)}
        />
        <StatCard
          label={t.settings.statAdmins}
          value={stats?.admins ?? 0}
          tone="info"
          active={statFilter === 'admin'}
          loading={statsLoading}
          onClick={() => toggleStatFilter('admin')}
        />
        <StatCard
          label={t.settings.statCashiers}
          value={stats?.cashiers ?? 0}
          tone="neutral"
          active={statFilter === 'cashier'}
          loading={statsLoading}
          onClick={() => toggleStatFilter('cashier')}
        />
        <StatCard
          label={t.settings.statNewThisMonth}
          value={stats?.newThisMonth ?? 0}
          tone="success"
          active={statFilter === 'new_this_month'}
          loading={statsLoading}
          onClick={() => toggleStatFilter('new_this_month')}
        />
        <StatCard
          label={t.settings.statActiveSessions}
          value={stats?.activeSessions ?? 0}
          tone={stats && stats.activeSessions > 0 ? 'success' : 'neutral'}
          clickable={false}
          loading={statsLoading}
        />
      </div>

      {/* Table + form */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] min-w-0">
        <Card className="h-fit min-w-0">
          <CardHeader className="flex flex-col gap-4 pb-6">
            <div className="space-y-1.5">
              <div className="text-xl font-bold tracking-tight">
                {t.settings.userManagement}
              </div>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditId(null)}
                >
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
      </div>

      <Toast />
    </div>
  );
}
