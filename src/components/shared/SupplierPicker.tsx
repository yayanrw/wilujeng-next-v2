'use client';

import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';

export function SupplierPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
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
      fetch(`/api/suppliers?search=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((rows: { id: string; name: string }[]) => {
          if (cancelled) return;
          setOptions(rows.slice(0, 10));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, isOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder="Type supplier name..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
      />

      {isOpen && query.trim().length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 text-sm shadow-md">
          {loading ? (
            <div className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400">Searching...</div>
          ) : options.length > 0 ? (
            <>
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-50"
                  onClick={() => {
                    setQuery(opt.name);
                    onChange(opt.name);
                    setIsOpen(false);
                  }}
                >
                  {opt.name}
                </button>
              ))}
              {!options.find(
                (o) => o.name.toLowerCase() === query.toLowerCase(),
              ) && (
                <div className="px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1.5">
                  Press enter to create &quot;{query}&quot;
                </div>
              )}
            </>
          ) : (
            <div className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400 flex flex-col gap-1">
              <span>No matches found.</span>
              <span className="text-xs">
                Press enter to create &quot;{query}&quot;
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
