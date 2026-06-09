'use client';

import { FilterX, FileUp } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useCatalogMeta } from '@/hooks/useCatalogMeta';
import { useTranslation } from '@/i18n/useTranslation';

export function ProductFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  brandId,
  onBrandChange,
  onImport,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  brandId: string;
  onBrandChange: (v: string) => void;
  onImport: () => void;
}) {
  const { categories, brands } = useCatalogMeta();
  const { t } = useTranslation();
  const hasActiveFilters = categoryId !== 'all' || brandId !== 'all';

  return (
    <div className="flex flex-col gap-2.5 w-full pt-2">
      <SearchInput
        placeholder={t.products.searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onSearchChange(''); }}
        wrapperClassName="w-full"
        autoFocus
      />
      <div className="flex items-center gap-2 flex-wrap">
        <SearchableSelect
          value={categoryId}
          onChange={onCategoryChange}
          options={categories}
          allLabel={t.common.allCategories}
          searchPlaceholder={t.common.search}
          noResultsText={t.products.noMatches}
          className="flex-1 min-w-[120px] sm:flex-none sm:w-36"
        />
        <SearchableSelect
          value={brandId}
          onChange={onBrandChange}
          options={brands}
          allLabel={t.common.allBrands}
          searchPlaceholder={t.common.search}
          noResultsText={t.products.noMatches}
          className="flex-1 min-w-[120px] sm:flex-none sm:w-36"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            className="shrink-0 h-10 w-10 p-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            onClick={() => {
              onCategoryChange('all');
              onBrandChange('all');
            }}
            title={t.products.clearFilters}
          >
            <FilterX className="h-4 w-4" />
            <span className="sr-only">{t.products.clearFilters}</span>
          </Button>
        )}
        <Button
          variant="secondary"
          className="ml-auto shrink-0 whitespace-nowrap gap-1.5"
          onClick={onImport}
        >
          <FileUp className="h-4 w-4 shrink-0" />
          {t.products.importProducts}
        </Button>
      </div>
    </div>
  );
}
