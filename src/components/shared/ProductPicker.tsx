'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { useCatalogStore } from '@/stores/catalogStore';
import { useTranslation } from '@/i18n/useTranslation';

export function ProductPicker({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const products = useCatalogStore((s) => s.products);
  const setProducts = useCatalogStore((s) => s.setProducts);
  const stocks = useCatalogStore((s) => s.stocks);
  const updateStocks = useCatalogStore((s) => s.updateStocks);

  // Hydrate catalog once if another page (e.g. POS) hasn't already
  useEffect(() => {
    if (products.length > 0) return;
    let cancelled = false;
    fetch('/api/pos/products')
      .then((r) => r.json())
      .then((catalog) => {
        if (!cancelled) setProducts(catalog);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [products.length, setProducts]);

  // Hydrate stock levels once so callers can show/validate stock
  useEffect(() => {
    if (Object.keys(stocks).length > 0) return;
    let cancelled = false;
    fetch('/api/pos/products/stocks')
      .then((r) => r.json())
      .then((data: { id: string; stock: number }[]) => {
        if (!cancelled) updateStocks(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stocks, updateStocks]);

  const selectedProduct = useMemo(
    () => (value ? products.find((p) => p.id === value) ?? null : null),
    [value, products],
  );

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [query, products]);

  // When value is null, clear the query
  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      {!value ? (
        <Input
          className={className}
          placeholder={t.stock.searchProduct}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
      ) : null}

      {value ? (
        <div
          className={`flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm ${
            className || 'min-h-10'
          }`}
        >
          <div className="min-w-0">
            <div className="truncate font-medium">
              {selectedProduct?.name ?? value}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedProduct?.sku ?? ''}
              {value in stocks ? (
                <span className="ml-2 tabular-nums">
                  {t.stock.systemStock}: {stocks[value]}
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800"
            onClick={() => {
              onChange(null);
              setQuery('');
              setIsOpen(true);
            }}
          >
            {t.common.clear}
          </button>
        </div>
      ) : null}

      {isOpen && query.trim().length > 0 && !value && (
        <div className="absolute top-full mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 text-sm shadow-md">
          {options.length > 0 ? (
            options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="flex w-full cursor-default select-none items-center justify-between gap-2 rounded-sm px-2 py-1.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-50"
                onClick={() => {
                  onChange(o.id);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <span className="min-w-0 truncate">{o.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {o.sku}
                  </span>
                  {o.id in stocks ? (
                    <span className="tabular-nums text-xs text-zinc-400 dark:text-zinc-500">
                      {stocks[o.id]}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          ) : (
            <div className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400">
              {t.pos.noProducts}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
