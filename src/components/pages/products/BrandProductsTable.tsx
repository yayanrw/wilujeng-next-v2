'use client';

import { Loader2, Trash } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { TableLoading } from '@/components/ui/TableLoading';

import type { Brand } from './useBrandProducts';

interface BrandProductsTableProps {
  brands: Brand[];
  loading: boolean;
  hasMore: boolean;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
  loadMoreLabel: string;
  loadingMessage: string;
  noDataMessage: string;
  actionLabel: string;
  nameLabel: string;
  deleteLabel: string;
}

export function BrandProductsTable({
  brands,
  loading,
  hasMore,
  onDelete,
  onLoadMore,
  loadMoreLabel,
  loadingMessage,
  noDataMessage,
  actionLabel,
  nameLabel,
  deleteLabel,
}: BrandProductsTableProps) {
  return (
    <>
      <div className="relative">
        {loading && brands.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-md text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {loadingMessage}
            </div>
          </div>
        )}

        <div className="w-full max-w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4 font-medium">{nameLabel}</th>
                <th className="py-3 px-4 font-medium text-right">{actionLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading && brands.length === 0 ? (
                <TableLoading colSpan={2} message={loadingMessage} />
              ) : brands.length === 0 ? (
                <TableEmpty colSpan={2} message={noDataMessage} />
              ) : (
                brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="group transition-colors border-l-2 border-l-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="py-3 px-4 align-middle text-zinc-900 dark:text-zinc-100">
                      {brand.name}
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        onClick={() => onDelete(brand.id)}
                        title={deleteLabel}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">{deleteLabel}</span>
                      </Button>
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
        hasMore={hasMore && brands.length > 0 && !loading}
        label={loadMoreLabel}
      />
    </>
  );
}
