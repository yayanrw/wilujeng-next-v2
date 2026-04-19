'use client';

import { useEffect, useState, useMemo } from 'react';

import { Search, LayoutGrid, List, X, Camera } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { usePosStore } from '@/stores/posStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

export function SearchPanel({
  inputRef,
  onToast,
  refreshKey,
  onCameraClick,
  viewMode = 'grid',
  onViewModeChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onToast: (m: string) => void;
  refreshKey?: number;
  onCameraClick?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const { t } = useTranslation();

  const products = useCatalogStore((s) => s.products);
  const stocks = useCatalogStore((s) => s.stocks);
  const loading = useCatalogStore((s) => s.loading);
  const addProduct = usePosStore((s) => s.addProduct);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  // Local filtering logic
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        const matchesQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q);
        const matchesCategory =
          categoryId === 'all' || p.categoryId === categoryId;
        return matchesQuery && matchesCategory;
      })
      .map((p) => ({
        ...p,
        stock: stocks[p.id] ?? 0,
        category: categories.find((c) => c.id === p.categoryId) || null,
      }));
  }, [products, stocks, query, categoryId, categories]);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="shrink-0 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <Input
              ref={inputRef}
              className="pl-9 text-base"
              placeholder={t.pos.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const q = query.trim().toLowerCase();
                if (!q) return;
                // For barcode scanner, we want an exact SKU match first
                const exact = results.find((r) => r.sku.toLowerCase() === q);
                if (exact) {
                  if (exact.stock <= 0) {
                    onToast(
                      `${t.pos.cannotAdd} ${exact.name}, ${t.pos.outOfStock}`,
                    );
                    return;
                  }
                  addProduct(exact, 1);
                  onToast(`${exact.name} ${t.pos.added}`);
                  setQuery('');
                }
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onCameraClick && (
              <button
                type="button"
                onClick={onCameraClick}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 transition-colors dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                title={t.pos.scanWithCamera}
                aria-label={t.pos.scanWithCamera}
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
            <div className="flex shrink-0 items-center rounded-md border border-zinc-200 p-1 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onViewModeChange?.('grid')}
                className={`rounded p-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange?.('list')}
                className={`rounded p-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setCategoryId('all')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              categoryId === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {t.common.allCategories}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryId === cat.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {loading && results.length === 0 ? (
          <div className="flex h-full items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {t.pos.loadingProducts}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 pb-4'
                : 'flex flex-col gap-2 pb-4'
            }
          >
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`group relative overflow-hidden rounded-xl border border-zinc-200 bg-white text-left transition-all hover:border-zinc-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:shadow-zinc-900/20 dark:focus:ring-zinc-500 ${
                  viewMode === 'grid'
                    ? 'flex h-full flex-col justify-between p-4'
                    : 'flex items-center justify-between p-3'
                }`}
                onClick={() => {
                  if (p.stock <= 0) {
                    onToast(
                      `${t.pos.cannotAdd} ${p.name}, ${t.pos.outOfStock}`,
                    );
                    return;
                  }
                  addProduct(p, 1);
                  onToast(`${p.name} ${t.pos.added}`);
                  inputRef.current?.focus();
                }}
              >
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
                        <span className="text-lg sm:text-xl leading-none">
                          +
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        {loading && results.length > 0 && (
          <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t.pos.loadingMore}
          </div>
        )}

        {!loading && !results.length ? (
          <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-2">
            <Search className="h-8 w-8 text-zinc-300" />
            <p>{t.pos.noProducts}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
