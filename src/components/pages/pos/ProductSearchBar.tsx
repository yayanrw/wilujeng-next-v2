'use client';

import { Search, LayoutGrid, List, X, Camera } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';

export function ProductSearchBar({
  inputRef,
  query,
  onQueryChange,
  onEnter,
  onCameraClick,
  viewMode = 'grid',
  onViewModeChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (q: string) => void;
  onEnter: (q: string) => void;
  onCameraClick?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <Input
          ref={inputRef}
          className="pl-9 text-base"
          placeholder={t.pos.searchPlaceholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            onEnter(query);
          }}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-mono text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 rounded">
            F2
          </kbd>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onCameraClick && (
          <button
            type="button"
            onClick={onCameraClick}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 transition-colors dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            title={t.pos.scanWithCamera}
            aria-label={t.pos.scanWithCamera}
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
        <div className="flex shrink-0 items-center rounded-md border border-zinc-200 p-1 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onViewModeChange?.('grid')}
            className={`rounded p-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.('list')}
            className={`rounded p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
