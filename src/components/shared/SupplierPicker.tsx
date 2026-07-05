'use client';

import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { useCatalogMeta } from '@/hooks/useCatalogMeta';
import { useTranslation } from '@/i18n/useTranslation';

export function SupplierPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const { t } = useTranslation();
  const { suppliers } = useCatalogMeta();

  return (
    <AutocompleteInput
      value={value}
      onChange={onChange}
      options={suppliers}
      placeholder={t.products.typeToCreate}
      noMatchText={t.products.noMatches}
      createHintText={t.products.willCreateNew}
    />
  );
}
