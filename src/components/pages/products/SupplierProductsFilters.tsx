'use client';

import { SearchInput } from '@/components/ui/SearchInput';
import { useTranslation } from '@/i18n/useTranslation';

interface SupplierProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function SupplierProductsFilters({ search, onSearchChange }: SupplierProductsFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5 w-full pt-2">
      <SearchInput
        placeholder={t.products.searchSuppliersPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
      />
    </div>
  );
}
