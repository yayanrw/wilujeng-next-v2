'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';
import { useCustomerStore } from '@/stores/customerStore';
import { useTranslation } from '@/i18n/useTranslation';

export function CustomerPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const customers = useCustomerStore((s) => s.customers);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === value) ?? null,
    [customers, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 10);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? '').includes(q),
      )
      .slice(0, 10);
  }, [customers, query]);

  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      {!value && (
        <Input
          className="text-base"
          placeholder={t.pos.searchCustomerPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
      )}

      {value && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-sm">
          <div className="min-w-0">
            <div className="truncate font-semibold text-blue-900">
              {selectedCustomer?.name ?? '—'}
            </div>
            <div className="text-xs text-blue-700/80">
              {selectedCustomer?.phone ?? t.customers.noPhone}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
            onClick={() => {
              onChange(null);
              setQuery('');
              setIsOpen(true);
            }}
          >
            {t.common.clear} / {t.pos.walkInCustomer}
          </button>
        </div>
      )}

      {isOpen && !value && (
        <div className="absolute top-full mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 text-sm shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                className="flex w-full cursor-default select-none items-center justify-between rounded-sm px-3 py-2 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-50 transition-colors"
                onClick={() => {
                  onChange(o.id);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{o.name}</span>
                  {o.phone && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {o.phone}
                    </span>
                  )}
                </div>
                {o.totalDebt > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    {formatIdr(o.totalDebt)}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="px-2 py-2 text-zinc-500 dark:text-zinc-400 text-center text-xs">
              {t.customers.noCustomers}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
