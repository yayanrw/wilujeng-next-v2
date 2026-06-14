'use client';

import { useState } from 'react';

import {
  HandCoins,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
import { SortHeader } from '@/components/ui/SortHeader';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { TableLoading } from '@/components/ui/TableLoading';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

import type { CustomerDto } from './CustomerForm';
import type { CustomerSortField } from './useCustomers';

interface CustomersTableProps {
  customers: CustomerDto[];
  loading: boolean;
  hasMore: boolean;
  sortField: CustomerSortField;
  sortDir: 'asc' | 'desc';
  editId: string | null;
  onSort: (field: CustomerSortField) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPayDebt: (customer: { id: string; name: string; totalDebt: number }) => void;
  onLoadMore: () => void;
}

export function CustomersTable({
  customers,
  loading,
  hasMore,
  sortField,
  sortDir,
  editId,
  onSort,
  onEdit,
  onDelete,
  onPayDebt,
  onLoadMore,
}: CustomersTableProps) {
  const { t } = useTranslation();
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  return (
    <>
      {actionMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenuId(null)}
        />
      )}

      <div className="relative min-w-0">
        {loading && customers.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-md text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t.customers.loading}
            </div>
          </div>
        )}

        <div
          className="w-full max-w-full overflow-x-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4 font-medium">
                  <SortHeader
                    label={t.customers.customerDetails}
                    field="name"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                </th>
                <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end">
                    <SortHeader
                      label={t.customers.points}
                      field="points"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
                  </div>
                </th>
                <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end">
                    <SortHeader
                      label={t.pos.outstandingDebt}
                      field="totalDebt"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
                  </div>
                </th>
                <th className="py-3 px-4 font-medium text-right">
                  {t.common.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading && customers.length === 0 ? (
                <TableLoading colSpan={4} message={t.customers.loading} />
              ) : customers.length === 0 ? (
                <TableEmpty colSpan={4} message={t.customers.noCustomers} />
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className={`group transition-colors border-l-2 ${
                      c.id === editId
                        ? 'border-l-zinc-900 dark:border-l-zinc-100 bg-zinc-50 dark:bg-zinc-900'
                        : 'border-l-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <td className="py-3 px-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="truncate font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left"
                            onClick={() => onEdit(c.id)}
                          >
                            {c.name}
                          </button>
                          {c.totalDebt > 0 && (
                            <Badge
                              tone="danger"
                              className="h-5 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider"
                            >
                              {t.customers.hasDebt}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 font-mono">
                          {c.phone ?? t.customers.noPhone}
                        </div>
                        {/* Mobile meta row */}
                        <div className="sm:hidden flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span>
                            {t.customers.points}:{' '}
                            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                              {c.points}
                            </span>
                          </span>
                          {c.totalDebt > 0 && (
                            <span className="tabular-nums font-semibold text-red-600 dark:text-red-400">
                              {formatIdr(c.totalDebt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100 hidden sm:table-cell">
                      {c.points}
                    </td>
                    <td className="py-3 px-4 align-middle text-right hidden sm:table-cell">
                      <span
                        className={`tabular-nums font-semibold ${c.totalDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}
                      >
                        {formatIdr(c.totalDebt)}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      {/* Desktop: inline action buttons */}
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        {c.totalDebt > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200 transition-colors"
                            onClick={() =>
                              onPayDebt({
                                id: c.id,
                                name: c.name,
                                totalDebt: c.totalDebt,
                              })
                            }
                            title={t.customers.payDebt}
                          >
                            <HandCoins className="h-4 w-4" />
                            <span className="sr-only">{t.customers.payDebt}</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          onClick={() => onEdit(c.id)}
                          title={t.customers.editCustomer}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">{t.common.edit}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          onClick={() => onDelete(c.id)}
                          title={t.common.delete}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">{t.common.delete}</span>
                        </Button>
                      </div>

                      {/* Mobile: … dropdown */}
                      <div className="sm:hidden relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          onClick={() =>
                            setActionMenuId(
                              actionMenuId === c.id ? null : c.id,
                            )
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {actionMenuId === c.id && (
                          <div className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl py-1">
                            {c.totalDebt > 0 && (
                              <>
                                <button
                                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  onClick={() => {
                                    onPayDebt({
                                      id: c.id,
                                      name: c.name,
                                      totalDebt: c.totalDebt,
                                    });
                                    setActionMenuId(null);
                                  }}
                                >
                                  <HandCoins className="h-4 w-4 shrink-0" />
                                  {t.customers.payDebt}
                                </button>
                                <div className="mx-2 my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                              </>
                            )}
                            <button
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                              onClick={() => {
                                onEdit(c.id);
                                setActionMenuId(null);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-zinc-400 shrink-0" />
                              {t.common.edit}
                            </button>
                            <div className="mx-2 my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                            <button
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              onClick={() => {
                                onDelete(c.id);
                                setActionMenuId(null);
                              }}
                            >
                              <Trash className="h-4 w-4 shrink-0" />
                              {t.common.delete}
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
        hasMore={hasMore && customers.length > 0 && !loading}
        label={t.customers.loadMore}
      />
    </>
  );
}
