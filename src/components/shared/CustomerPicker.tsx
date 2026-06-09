'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';
import { useCustomerStore } from '@/stores/customerStore';
import { useTranslation } from '@/i18n/useTranslation';

export function CustomerPicker({
  value,
  onChange,
  onCreate,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  onCreate?: (name: string) => void;
}) {
  const customers = useCustomerStore((s) => s.customers);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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

  const hasExactMatch = useMemo(
    () => customers.some((c) => c.name.toLowerCase() === query.trim().toLowerCase()),
    [customers, query],
  );

  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectCustomer(id: string) {
    onChange(id);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function triggerCreate() {
    const name = query.trim();
    if (!name || !onCreate) return;
    onCreate(name);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIsOpen(true); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Tab') {
      if (filtered.length > 0) {
        e.preventDefault();
        selectCustomer(filtered[highlightedIndex >= 0 ? highlightedIndex : 0].id);
      } else if (query.trim() && onCreate) {
        e.preventDefault();
        triggerCreate();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
        selectCustomer(filtered[highlightedIndex].id);
      } else if (filtered.length > 0) {
        selectCustomer(filtered[0].id);
      } else if (query.trim() && onCreate) {
        triggerCreate();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  const showDropdown = isOpen && (filtered.length > 0 || (!!query.trim() && !!onCreate));

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
          onKeyDown={handleKeyDown}
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

      {showDropdown && (
        <div className="absolute top-full mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 text-sm shadow-lg">
          {filtered.length > 0 ? (
            <>
              {filtered.map((o, idx) => (
                <button
                  key={o.id}
                  type="button"
                  className={`flex w-full cursor-default select-none items-center justify-between rounded-sm px-3 py-2 outline-none transition-colors ${
                    idx === highlightedIndex
                      ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-50'
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCustomer(o.id)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{o.name}</span>
                    {o.phone && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{o.phone}</span>
                    )}
                  </div>
                  {o.totalDebt > 0 && (
                    <span className="shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      {formatIdr(o.totalDebt)}
                    </span>
                  )}
                </button>
              ))}
              {onCreate && query.trim() && !hasExactMatch && (
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-sm border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-2 transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={triggerCreate}
                >
                  <span className="font-semibold">+</span>
                  <span>{t.customers.createNew}: &quot;{query.trim()}&quot;</span>
                </button>
              )}
            </>
          ) : (
            <div className="px-3 py-2 flex flex-col gap-1.5">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{t.customers.noCustomers}</span>
              {onCreate && query.trim() && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={triggerCreate}
                >
                  <span className="font-bold">+</span>
                  {t.customers.createNew}: &quot;{query.trim()}&quot;
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
