'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

type Option = { id: string; name: string };

type SearchableSelectProps = {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  allLabel: string;
  searchPlaceholder?: string;
  className?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  allLabel,
  searchPlaceholder = 'Search...',
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel =
    value === 'all'
      ? allLabel
      : (options.find((o) => o.id === value)?.name ?? allLabel);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Defer focus so the dropdown is rendered first
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const select = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-300"
      >
        <span
          className={
            value === 'all'
              ? 'text-zinc-400 dark:text-zinc-500 truncate'
              : 'text-zinc-900 dark:text-zinc-100 truncate'
          }
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md">
          <div className="p-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
              placeholder={searchPlaceholder}
              className="w-full rounded-sm bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-700"
            />
          </div>
          <div className="max-h-52 overflow-auto p-1">
            <button
              type="button"
              onClick={() => select('all')}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            >
              <span className="flex-1 text-left">{allLabel}</span>
              {value === 'all' && <Check className="h-3.5 w-3.5 shrink-0 text-zinc-900 dark:text-zinc-100" />}
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => select(opt.id)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="flex-1 text-left">{opt.name}</span>
                {value === opt.id && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-zinc-400 dark:text-zinc-500">
                {searchPlaceholder}…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
