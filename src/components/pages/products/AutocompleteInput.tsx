'use client';

import { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';

type AutocompleteOption = { id: string; name: string };

type AutocompleteProps = {
  value: string;
  onChange: (val: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  label?: string;
  onNext?: () => void;
};

export const AutocompleteInput = forwardRef<HTMLInputElement, AutocompleteProps>(
  function AutocompleteInput({ value, onChange, options, placeholder, label, onNext }, ref) {
    const [query, setQuery] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
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

    // Reset highlight when filtered list changes
    useEffect(() => {
      setHighlightedIndex(-1);
    }, [query]);

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

    const selectOption = (name: string) => {
      setQuery(name);
      onChange(name);
      setIsOpen(false);
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          selectOption(filtered[highlightedIndex].name);
        } else {
          setIsOpen(false);
        }
        onNext?.();
      } else if (e.key === 'Tab') {
        if (filtered.length > 0) {
          selectOption(filtered[0].name);
        } else {
          setIsOpen(false);
        }
        // Let default Tab propagate to move focus naturally
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    return (
      <div ref={wrapperRef} className="relative">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 block">
            {label}
          </label>
        )}
        <Input
          ref={ref}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 text-sm shadow-md">
            {filtered.length > 0 ? (
              <>
                {filtered.map((opt, idx) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none transition-colors ${
                      idx === highlightedIndex
                        ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-50'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOption(opt.name)}
                  >
                    {opt.name}
                  </button>
                ))}
                {query.trim().length > 0 && !hasExactMatch && (
                  <div className="px-2 py-1.5 text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1.5">
                    {t.products.willCreateNew}: &quot;{query}&quot;
                  </div>
                )}
              </>
            ) : query.trim().length > 0 ? (
              <div className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400 flex flex-col gap-1">
                <span>{t.products.noMatches}</span>
                <span className="text-xs">{t.products.willCreateNew}: &quot;{query}&quot;</span>
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
  },
);
