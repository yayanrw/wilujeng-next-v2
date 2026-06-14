'use client';

import { SearchInput } from '@/components/ui/SearchInput';
import { useTranslation } from '@/i18n/useTranslation';

export function CustomersFilters({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2.5 w-full pt-2">
      <SearchInput
        placeholder={t.customers.searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onSearchChange('');
        }}
        wrapperClassName="w-full"
        autoFocus
      />
    </div>
  );
}
