'use client';

import { FileUp } from 'lucide-react';

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

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
      <SearchInput
        placeholder={t.products.searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        wrapperClassName="flex-1"
      />
      <div className="flex flex-wrap gap-3 w-full sm:w-auto sm:flex-nowrap">
        <SearchableSelect
          value={categoryId}
          onChange={onCategoryChange}
          options={categories}
          allLabel={t.common.allCategories}
          searchPlaceholder={t.common.search}
          className="w-full sm:w-45"
        />
        <SearchableSelect
          value={brandId}
          onChange={onBrandChange}
          options={brands}
          allLabel={t.common.allBrands}
          searchPlaceholder={t.common.search}
          className="w-full sm:w-45"
        />
        <Button
          variant="secondary"
          className="h-10 whitespace-nowrap bg-white dark:bg-zinc-950 gap-1.5"
          onClick={onImport}
        >
          <FileUp className="h-4 w-4 shrink-0" />
          {t.products.importProducts}
        </Button>
      </div>
    </div>
  );
}
