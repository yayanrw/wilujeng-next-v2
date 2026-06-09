'use client';

import { Search } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';
import type { ProductWithMeta } from './ProductCatalog';

const GRID_CLASS =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 pb-4';
const LIST_CLASS = 'flex flex-col gap-2 pb-4';

export function ProductList({
  results,
  viewMode,
  loading,
  categoryId,
  highlightFirst,
  onProductClick,
}: {
  results: ProductWithMeta[];
  viewMode: 'grid' | 'list';
  loading: boolean;
  categoryId: string;
  highlightFirst?: boolean;
  onProductClick: (p: ProductWithMeta) => void;
}) {
  const { t } = useTranslation();

  if (loading && results.length === 0) {
    return (
      <div className={viewMode === 'grid' ? GRID_CLASS : LIST_CLASS}>
        {Array.from({ length: viewMode === 'grid' ? 8 : 6 }).map((_, i) =>
          viewMode === 'grid' ? (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between p-4"
            >
              <div className="w-full">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="h-5 w-8 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                </div>
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800 mb-1.5" />
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800 mb-1.5" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="mt-4 flex w-full items-end justify-between">
                <div className="h-4 w-14 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ) : (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between p-3"
            >
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <div className="h-6 w-14 shrink-0 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="h-4 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ),
        )}
      </div>
    );
  }

  return (
    <>
      <div className={viewMode === 'grid' ? GRID_CLASS : LIST_CLASS}>
        {results.map((p, idx) => {
          const isTop = highlightFirst && idx === 0;
          return (
          <button
            key={p.id}
            type="button"
            className={`group relative overflow-hidden rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500 ${
              isTop
                ? 'border-zinc-900 dark:border-zinc-100 shadow-md bg-white dark:bg-zinc-950'
                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:shadow-zinc-900/20'
            } ${
              viewMode === 'grid'
                ? 'flex h-full flex-col justify-between p-4'
                : 'flex items-center justify-between p-3'
            }`}
            onClick={() => onProductClick(p)}
          >
            {isTop && (
              <kbd className="absolute top-1.5 right-1.5 z-10 rounded border border-zinc-900/20 dark:border-zinc-100/20 bg-zinc-900 dark:bg-zinc-100 px-1 py-0.5 font-mono text-[9px] leading-none text-white dark:text-zinc-900 pointer-events-none">
                ↵
              </kbd>
            )}
            {viewMode === 'grid' ? (
              <>
                <div className="w-full">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Badge
                      tone={
                        p.stock <= 0
                          ? 'danger'
                          : p.stock <= 5
                            ? 'warning'
                            : 'success'
                      }
                      className="h-5 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider"
                    >
                      {p.stock}
                    </Badge>
                    {p.category && p.category.id !== categoryId ? (
                      <span className="truncate text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        {p.category.name}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                    {p.name}
                  </h3>
                  <p className="mt-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    {p.sku}
                  </p>
                </div>
                <div className="mt-4 flex w-full items-end justify-between">
                  <div className="text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatIdr(p.basePrice)}
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900">
                    <span className="text-lg leading-none">+</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="flex shrink-0 flex-col items-start gap-1">
                    <Badge
                      tone={
                        p.stock <= 0
                          ? 'danger'
                          : p.stock <= 5
                            ? 'warning'
                            : 'success'
                      }
                      className="h-6 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
                    >
                      {p.stock} Qty
                    </Badge>
                  </div>
                  <div className="flex flex-1 flex-col min-w-0 pr-2">
                    <h3 className="truncate text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <p className="truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                        {p.sku}
                      </p>
                      {p.category && p.category.id !== categoryId ? (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700 shrink-0">
                            •
                          </span>
                          <span className="truncate text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                            {p.category.name}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                  <div className="text-xs sm:text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatIdr(p.basePrice)}
                  </div>
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900">
                    <span className="text-lg sm:text-xl leading-none">+</span>
                  </div>
                </div>
              </>
            )}
          </button>
          );
        })}
      </div>

      {loading && results.length > 0 && (
        <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t.pos.loadingMore}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-2">
          <Search className="h-8 w-8 text-zinc-300" />
          <p>{t.pos.noProducts}</p>
        </div>
      )}
    </>
  );
}
