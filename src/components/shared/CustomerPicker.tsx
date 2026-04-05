'use client';

import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  totalDebt: number;
};

export function CustomerPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<CustomerRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(
    null,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  // When value is null, clear the query
  useEffect(() => {
    if (!value) {
      setQuery('');
      setSelectedCustomer(null);
    }
  }, [value]);

  // Fetch customer details on mount if we have a value but no selectedCustomer
  useEffect(() => {
    if (value && !selectedCustomer) {
      let cancelled = false;
      fetch(`/api/customers/${value}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && !data.error && data.customer) {
            setSelectedCustomer(data.customer);
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [value, selectedCustomer]);

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
      fetch(`/api/customers?search=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((rows: CustomerRow[]) => {
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
          placeholder="Search customer by name or phone (Leave empty for Walk-in)"
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
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-sm">
          <div className="min-w-0">
            <div className="truncate font-semibold text-blue-900">
              {selectedCustomer?.name ?? 'Selected Customer'}
            </div>
            <div className="text-xs text-blue-700/80">
              {selectedCustomer?.phone ?? 'No phone number'}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
            onClick={() => {
              onChange(null);
              setQuery('');
              setSelectedCustomer(null);
              setIsOpen(true);
            }}
          >
            Clear / Walk-in
          </button>
        </div>
      ) : null}

      {isOpen && query.trim().length > 0 && !value && (
        <div className="absolute top-full mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white p-1 text-sm shadow-lg">
          {loading ? (
            <div className="px-2 py-2 text-zinc-500 text-center text-xs">
              Searching...
            </div>
          ) : options.length > 0 ? (
            options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="flex w-full cursor-default select-none items-center justify-between rounded-sm px-3 py-2 outline-none hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                onClick={() => {
                  onChange(o.id);
                  setSelectedCustomer(o);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{o.name}</span>
                  {o.phone && (
                    <span className="text-xs text-zinc-500">{o.phone}</span>
                  )}
                </div>
                {o.totalDebt > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Debt: {formatIdr(o.totalDebt)}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="px-2 py-2 text-zinc-500 text-center text-xs">
              No customers found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
