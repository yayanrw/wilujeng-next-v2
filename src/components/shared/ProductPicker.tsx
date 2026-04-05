'use client';

import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';

type ProductRow = { id: string; sku: string; name: string; stock: number };

export function ProductPicker({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ProductRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
    null,
  );

  // Fetch product details on mount if we have a value but no selectedProduct
  useEffect(() => {
    if (value && !selectedProduct) {
      let cancelled = false;
      fetch(`/api/products/${value}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && !data.error) {
            setSelectedProduct(data);
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [value, selectedProduct]);

  // When value is null, clear the query
  useEffect(() => {
    if (!value) {
      setQuery('');
      setSelectedProduct(null);
    }
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

  useEffect(() => {
    const q = query.trim();
    if (!q || !isOpen) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const t = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((rows: ProductRow[]) => {
          if (cancelled) return;
          setOptions(rows.slice(0, 10));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, isOpen]);

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      {!value ? (
        <Input
          className={className}
          placeholder="Search product by name or SKU"
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
              {selectedProduct?.name ?? 'Selected Product'}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedProduct?.sku ?? value}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800"
            onClick={() => {
              onChange(null);
              setQuery('');
              setSelectedProduct(null);
              setIsOpen(true);
            }}
          >
            Clear
          </button>
        </div>
      ) : null}

      {isOpen && query.trim().length > 0 && !value && (
        <div className="absolute top-full mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 text-sm shadow-md">
          {loading ? (
            <div className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400">
              Searching...
            </div>
          ) : options.length > 0 ? (
            options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="flex w-full cursor-default select-none items-center justify-between rounded-sm px-2 py-1.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-50"
                onClick={() => {
                  onChange(o.id);
                  setSelectedProduct(o);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <span className="min-w-0 truncate">{o.name}</span>
                <span className="shrink-0 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {o.sku}
                </span>
              </button>
            ))
          ) : (
            <div className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400 flex flex-col gap-1">
              <span>No products found.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
