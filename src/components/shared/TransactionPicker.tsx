'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';
import { formatIdr } from '@/utils/money';

type TransactionRow = {
  id: string;
  customerName: string | null;
  totalAmount: number;
  createdAt: string;
};

export function TransactionPicker({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Fetch recent transactions once, the first time the dropdown opens.
  useEffect(() => {
    if (!isOpen || rows.length > 0) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/transactions/recent')
      .then((r) => r.json())
      .then((data: TransactionRow[]) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, rows.length]);

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

  const selectedTx = useMemo(
    () => (value ? rows.find((r) => r.id === value) ?? null : null),
    [value, rows],
  );

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter(
          (r) =>
            r.id.toLowerCase().includes(q) ||
            r.customerName?.toLowerCase().includes(q),
        )
      : rows;
    return base.slice(0, 10);
  }, [query, rows]);

  return (
    <div ref={wrapperRef} className={`relative flex flex-col gap-2 ${className}`}>
      {!value ? (
        <Input
          placeholder={t.stock.searchTransaction}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          className="h-9 text-sm"
        />
      ) : null}

      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-sm transition-all animate-in fade-in duration-200 dark:border-blue-900 dark:bg-blue-950/40">
          <div className="min-w-0">
            <div className="truncate font-mono text-[11px] font-semibold text-blue-900 dark:text-blue-300">
              #{value.slice(0, 8)}...
            </div>
            <div className="text-[10px] text-blue-700/80 dark:text-blue-400/80">
              {selectedTx
                ? new Date(selectedTx.createdAt).toLocaleString()
                : t.common.searching}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors dark:text-blue-400 dark:hover:bg-blue-900/40"
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

      {isOpen && !value && (
        <div className="absolute top-full mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 text-sm shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          {loading && options.length === 0 ? (
            <div className="px-2 py-4 text-zinc-500 text-center text-xs">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800 mx-auto mb-2" />
              {t.common.searching}
            </div>
          ) : options.length > 0 ? (
            options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="flex w-full cursor-default select-none items-center justify-between rounded-sm px-3 py-2 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                onClick={() => {
                  onChange(o.id);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] font-semibold">
                    #{o.id.slice(0, 8)}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(o.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xs">
                    {formatIdr(o.totalAmount)}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {o.customerName || t.pos.walkInCustomer}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-2 py-3 text-zinc-500 text-center text-xs">
              {t.common.noData}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
