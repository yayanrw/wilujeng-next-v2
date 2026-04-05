import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function Badge({
  className,
  children,
  tone = 'neutral',
}: {
  className?: string;
  children: ReactNode;
  tone?: 'neutral' | 'warning' | 'success' | 'danger';
}) {
  const toneClass: Record<string, string> = {
    neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    warning:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    success:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
