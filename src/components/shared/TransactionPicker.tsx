'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [options, setOptions] = useState<TransactionRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionRow | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!value) {
      setQuery('');
      setSelectedTx(null);
    }
  }, [value]);

  // Fetch transaction details if we have a value but no selectedTx
  useEffect(() => {
    if (value && !selectedTx) {
      let cancelled = false;
      // Fetch latest sales to find this transaction or use a specific lookup
      // For MVP, we can just use the search API with the exact ID
      fetch(`/api/reports/sales?date=${new Date().toISOString().slice(0, 10)}`) // This is a bit hacky, normally we'd want a specific GET /api/transactions/:id
        .then((r) => r.json())
        .then((rows: TransactionRow[]) => {
          if (cancelled) return;
          const found = rows.find(r => r.id === value);
          if (found) setSelectedTx(found);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [value, selectedTx]);

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
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);

    const tRef = setTimeout(() => {
      // Use the sales report API but maybe with a wider date range or a dedicated search
      // For now, let's fetch today's transactions as a default search
      const today = new Date().toISOString().slice(0, 10);
      fetch(`/api/reports/sales?date=${today}`)
        .then((r) => r.json())
        .then((rows: TransactionRow[]) => {
          if (cancelled) return;
          // Client-side filter for MVP searching
          const filtered = q 
            ? rows.filter(r => r.id.toLowerCase().includes(q.toLowerCase()) || (r.customerName?.toLowerCase().includes(q.toLowerCase())))
            : rows;
          setOptions(filtered.slice(0, 10));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(tRef);
    };
  }, [query, isOpen]);

  return (
    <div ref={wrapperRef} className={`relative flex flex-col gap-2 ${className}`}>
      {!value ? (
        <Input
          placeholder={t.pos.searchPlaceholder}
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
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-sm transition-all animate-in fade-in duration-200">
          <div className="min-w-0">
            <div className="truncate font-mono text-[11px] font-semibold text-blue-900">
              #{value.slice(0, 8)}...
            </div>
            <div className="text-[10px] text-blue-700/80">
              {selectedTx ? new Date(selectedTx.createdAt).toLocaleString() : 'Loading...'}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            onClick={() => {
              onChange(null);
              setQuery('');
              setSelectedTx(null);
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
                  setSelectedTx(o);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] font-semibold">#{o.id.slice(0, 8)}</span>
                  <span className="text-[10px] text-zinc-500">{new Date(o.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xs">{formatIdr(o.totalAmount)}</div>
                  <div className="text-[10px] text-zinc-400">{o.customerName || t.pos.walkInCustomer}</div>
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
