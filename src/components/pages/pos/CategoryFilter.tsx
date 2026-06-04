'use client';

import { useCatalogMeta } from '@/hooks/useCatalogMeta';
import { useTranslation } from '@/i18n/useTranslation';

export function CategoryFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { categories, loaded } = useCatalogMeta();
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onChange('all')}
        className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          value === 'all'
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
        }`}
      >
        {t.common.allCategories}
      </button>
      {!loaded
        ? [80, 64, 96, 72, 88].map((w, i) => (
            <div
              key={i}
              className="h-8 shrink-0 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800"
              style={{ width: w }}
            />
          ))
        : categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                value === cat.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
    </div>
  );
}
