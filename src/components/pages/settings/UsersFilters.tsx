'use client';

import { SearchInput } from '@/components/ui/SearchInput';
import { useTranslation } from '@/i18n/useTranslation';

interface Props {
  search: string;
  onSearch: (value: string) => void;
}

export function UsersFilters({ search, onSearch }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5 w-full pt-2">
      <SearchInput
        placeholder={t.settings.searchUsers}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        autoFocus
      />
    </div>
  );
}
