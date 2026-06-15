'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { BottomDrawer } from '@/components/ui/BottomDrawer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatCard } from '@/components/shared/StatCard';
import { formatIdr } from '@/utils/money';

import { CustomerForm } from './customers/CustomerForm';
import { CustomersFilters } from './customers/CustomersFilters';
import { CustomersTable } from './customers/CustomersTable';
import { PayDebtModal } from './customers/PayDebtModal';
import { useCustomers } from './customers/useCustomers';

export function CustomersClient() {
  const {
    customers,
    loading,
    hasMore,
    search,
    setSearch,
    loadMore,
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
    stats,
    statsLoading,
    statFilter,
    setStatFilter,
    toggleStatFilter,
    t,
    Toast,
  } = useCustomers();

  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleTableEdit(id: string) {
    setEditId(id);
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1023px)').matches
    ) {
      setDrawerOpen(true);
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditId(null);
  }

  function handleDrawerSaved(success: boolean, errorMsg?: string) {
    handleSaved(success, errorMsg);
    if (success) setDrawerOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 min-w-0 overflow-x-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 m-1">
        <StatCard
          label={t.customers.statTotal}
          value={stats?.total ?? 0}
          tone="neutral"
          active={statFilter === null}
          loading={statsLoading}
          onClick={() => setStatFilter(null)}
        />
        <StatCard
          label={t.customers.statTotalDebt}
          value={stats ? formatIdr(stats.totalDebt) : '—'}
          tone={stats && stats.totalDebt > 0 ? 'danger' : 'neutral'}
          clickable={false}
          loading={statsLoading}
        />
        <StatCard
          label={t.customers.statDebtors}
          value={stats?.debtorCount ?? 0}
          tone={stats && stats.debtorCount > 0 ? 'danger' : 'neutral'}
          active={statFilter === 'debt'}
          loading={statsLoading}
          onClick={() => toggleStatFilter('debt')}
        />
        <StatCard
          label={t.customers.statPoints}
          value={stats?.totalPoints.toLocaleString('id-ID') ?? 0}
          tone="info"
          clickable={false}
          loading={statsLoading}
        />
        <StatCard
          label={t.customers.statNewThisMonth}
          value={stats?.newThisMonth ?? 0}
          tone="success"
          active={statFilter === 'new_this_month'}
          loading={statsLoading}
          onClick={() => toggleStatFilter('new_this_month')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] min-w-0">
        <Card className="h-fit min-w-0">
          <CardHeader className="flex flex-col gap-4 pb-6">
            <div className="space-y-1.5">
              <div className="text-xl font-bold tracking-tight">
                {t.customers.title}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {!loading && customers.length > 0
                  ? `${customers.length}${hasMore ? '+' : ''} ${t.customers.customersLoaded}`
                  : t.customers.subtitle}
              </div>
            </div>
            <CustomersFilters search={search} onSearchChange={setSearch} />
          </CardHeader>
          <CardContent className="p-0 min-w-0">
            <CustomersTable
              customers={customers}
              loading={loading}
              hasMore={hasMore}
              sortField={sortField}
              sortDir={sortDir}
              editId={editId}
              onSort={handleSort}
              onEdit={handleTableEdit}
              onDelete={openDeleteDialog}
              onPayDebt={setPayDebtCustomer}
              onLoadMore={loadMore}
            />
          </CardContent>
        </Card>

        {/* Desktop: right-panel form card */}
        <Card className="hidden lg:block min-w-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">
                  {editId ? t.customers.editCustomer : t.customers.addCustomer}
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
                  <Plus className="h-3 w-3 mr-1" />
                  {t.common.new}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CustomerForm
              mode={editId ? 'edit' : 'create'}
              initial={editId ? (selected ?? undefined) : undefined}
              onSaved={handleSaved}
            />

            {editId && detail && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
                <div className="text-sm font-semibold mb-3">
                  {t.customers.recentTransactions}
                </div>
                {detail.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                          <th className="py-2">{t.reports.id}</th>
                          <th className="py-2">{t.reports.total}</th>
                          <th className="py-2">{t.reports.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.transactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-zinc-100 dark:border-zinc-800"
                          >
                            <td className="py-2 font-mono text-xs">
                              {tx.id.slice(0, 8)}
                            </td>
                            <td className="py-2 tabular-nums">
                              {formatIdr(tx.totalAmount)}
                            </td>
                            <td className="py-2">
                              <Badge
                                tone={
                                  tx.status === 'debt' ? 'danger' : 'success'
                                }
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {t.pos[tx.status as keyof typeof t.pos] ||
                                  tx.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 text-center border border-zinc-100 dark:border-zinc-800">
                    {t.customers.noRecentTransactions}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile: FAB + bottom drawer */}
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setDrawerOpen(true);
          }}
          className="lg:hidden fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          aria-label={t.customers.addCustomer}
        >
          <Plus className="h-6 w-6" />
        </button>

        <BottomDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          title={editId ? t.customers.editCustomer : t.customers.addCustomer}
          subtitle={t.common.adminOnly}
        >
          <CustomerForm
            mode={editId ? 'edit' : 'create'}
            initial={editId ? (selected ?? undefined) : undefined}
            onSaved={handleDrawerSaved}
          />
        </BottomDrawer>

        <ConfirmDialog
          open={isDeleteDialogOpen}
          title={t.customers.deleteConfirmTitle}
          description={t.customers.deleteConfirmDesc}
          confirmText={t.common.delete}
          cancelText={t.common.cancel}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          loading={deleting}
        />

        {payDebtCustomer && (
          <PayDebtModal
            customerName={payDebtCustomer.name}
            totalDebt={payDebtCustomer.totalDebt}
            onClose={() => setPayDebtCustomer(null)}
            onSubmit={handlePayDebt}
          />
        )}

        <Toast />
      </div>
    </div>
  );
}
