'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';

type AutocompleteOption = { id: string; name: string };

type AutocompleteProps = {
  value: string;
  onChange: (val: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  label?: string;
};

export function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  label,
}: AutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Sync internal query state when value prop changes (e.g. initial load or reset)
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

  // Filter locally — no network request per keystroke
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? options.filter((o) => o.name.toLowerCase().includes(q))
      : options;
    return matches.slice(0, 50);
  }, [query, options]);

  const hasExactMatch = useMemo(
    () =>
      options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase()),
    [options, query],
  );

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 block">
          {label}
        </label>
      )}
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay closing slightly so clicks on dropdown items can register first
          setTimeout(() => setIsOpen(false), 200);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 text-sm shadow-md">
          {filtered.length > 0 ? (
            <>
              {filtered.map((opt) => (
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
              {/* If exact match doesn't exist, show create option */}
              {query.trim().length > 0 && !hasExactMatch && (
                <div className="px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1.5">
                  {t.products.pressEnterToCreate} &quot;{query}&quot;
                </div>
              )}
            </>
          ) : query.trim().length > 0 ? (
            <div className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400 flex flex-col gap-1">
              <span>{t.products.noMatches}</span>
              <span className="text-xs">
                {t.products.pressEnterToCreate} &quot;{query}&quot;
              </span>
            </div>
          ) : (
            <div className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400">
              {t.products.noMatches}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
