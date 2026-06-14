'use client';

import { SearchInput } from '@/components/ui/SearchInput';
import { useTranslation } from '@/i18n/useTranslation';

interface CategoryProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function CategoryProductsFilters({ search, onSearchChange }: CategoryProductsFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5 w-full pt-2">
      <SearchInput
        placeholder={t.products.searchCategoriesPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
      />
    </div>
  );
}
