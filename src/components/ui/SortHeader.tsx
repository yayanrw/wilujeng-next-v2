import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SortHeaderProps<T extends string> {
  label: string;
  field: T;
  sortField: T;
  sortDir: 'asc' | 'desc';
  onSort: (field: T) => void;
}

export function SortHeader<T extends string>({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: SortHeaderProps<T>) {
  const isActive = sortField === field;
  return (
    <button
      type="button"
      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        sortDir === 'asc'
          ? <ChevronUp className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
          : <ChevronDown className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
      )}
    </button>
  );
}
