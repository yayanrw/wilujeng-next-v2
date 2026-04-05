'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';

type AutocompleteProps = {
  value: string;
  onChange: (val: string) => void;
  fetchEndpoint: string;
  placeholder?: string;
  label?: string;
};

export function AutocompleteInput({
  value,
  onChange,
  fetchEndpoint,
  placeholder,
  label,
}: AutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  // Debounce logic for fetch requests
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      if (!query.trim()) setOptions([]);
      return;
    }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${fetchEndpoint}?search=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setOptions(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 500); // Increased debounce to 500ms for optimal typing experience

    return () => clearTimeout(t);
  }, [query, isOpen, fetchEndpoint]);

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="text-sm font-medium mb-1 block">{label}</label>
      )}
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
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
              {/* If exact match doesn't exist, show create option */}
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
